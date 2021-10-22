const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { JSDOM } = require("jsdom");
const qs = require("qs");
const ntlm = require("request-ntlm-promise");

const { lazyVariable, currentTime, doRetries } = require("./utils");
const { maxDataReportRetries, runtimeOptsGetStudentSchedule, maxCourseScheduleRetries, courseDataMaxAge, groupScheduleMaxAge } = require("./consts");

const USERNAME = functions.config().credentials.username;
const PASSWORD = functions.config().credentials.password;

const courseScheduleRequestDetails = lazyVariable(async () => {
    return (await admin.firestore().collection("schedules").doc("get_courses_info").get()).data().request_details;
});

const groupScheduleRequestDetails = lazyVariable(async () => {
    return (await admin.firestore().collection("schedules").doc("get_group_schedules_info").get()).data().request_details;
});

// converts the parsed data into an object of expected courses
const getParseGS = (inis) => {
    let ret = {};
    for (ini of inis)
        for (let i = 0; i < ini.length; i += 1)
            for (let j = 0; j < ini[i].length; j += 1)
                if (ini[i][j])
                    for (const session of ini[i][j]) {
                        if (!ret[session.expectedGroup]) ret[session.expectedGroup] = [];
                        ret[session.expectedGroup].push({ x: i, y: j, location: session.location });
                    }

    return ret;
};

// parses the raw html of group schedules
const parseGroupSchedules = (data) => {
    var doc = new JSDOM(data).window.document;

    const ret = Array.from(doc.querySelector("#scdTbl").firstElementChild.children)
        .slice(1)
        .map((row) => {
            if (row.children.length == 2) return [];
            return Array.from(row.children)
                .slice(1)
                .map((slot) => {
                    if (!slot.firstElementChild.firstElementChild) return [];
                    return Array.from(slot.firstElementChild.firstElementChild.children).map((session) => {
                        const s = session.children;
                        const [course, courseCode, type] = s[2].textContent.match(/^(\w*\s*\w*)\n\s*(\w*)\n\s*$/);
                        const group = s[0].textContent;
                        const idx = group.lastIndexOf(" ");
                        const sessionGroup = group.slice(idx + 1);
                        let typeName = "";
                        if (sessionGroup[0] == "T") {
                            typeName = "Tutorial";
                        } else if (sessionGroup[0] == "L") {
                            typeName = "Lecture";
                        } else if (sessionGroup[0] == "P") {
                            typeName = "Practical";
                        } else {
                            typeName = "Unknown";
                            functions.logger.error("unknown type", { courseInfo, groupInfo });
                        }
                        const expectedGroup = courseCode + " - " + group.slice(0, idx) + sessionGroup.slice(1).replace(/^0+/, "") + " (" + typeName + ")";
                        return { courseCode, type, location: s[1].textContent, group, expectedGroup };
                    });
                });
        });
    return ret;
};

// returns the groups schedule by requesting it from guc.edu.eg
const downloadGroupScheduleHelper = async (id, viewState, eventValidation) => {
    return doRetries(async () => {
        const formData = qs.stringify({ __VIEWSTATE: viewState, __EVENTVALIDATION: eventValidation, scdTpLst: id, __EVENTTARGET: "scdTpLst" });

        const resp = await ntlm.post({
            username: USERNAME,
            password: PASSWORD,
            url: "http://student.guc.edu.eg/Web/Student/Schedule/GeneralGroupSchedule.aspx",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (resp == undefined) {
            throw "getCourseSchedule, result is undefined";
        }

        return parseGroupSchedules(resp);
    }, maxCourseScheduleRetries);
    // var event_validation = doc.querySelector("#__EVENTVALIDATION").value;
    // var view_state = doc.querySelector("#__VIEWSTATE").value;
};

// gets the group schedule from the guc website and saves it to the store
const downloadGroupSchedule = async (groupScheduleData) => {
    const { view_state: viewState, event_validation: eventValidation } = await groupScheduleRequestDetails();

    const rawGroupsSchedules = await Promise.all(groupScheduleData.id.map((id) => downloadGroupScheduleHelper(id, viewState, eventValidation)));
    const groupsSchedules = getParseGS(rawGroupsSchedules);
    const data = { loaded: true, sched: groupsSchedules, lastUpdateTime: currentTime() };

    await admin
        .firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("group_" + groupScheduleData.group_name)
        .doc("info")
        .set(data, { merge: true });

    functions.logger.info(`downloaded group_schedule ${groupScheduleData.group_name} with ${Object.keys(data.sched).length} groups`);
    return data;
};

// returns the group schedule from either the store or calling downloadGroupSchedule
const getGroupSchedule = async (group) => {
    if (!group) throw "invalid group";

    const doc = await admin
        .firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("group_" + group)
        .doc("info")
        .get();

    if (!doc.exists) throw "group does not exist";

    const groupSchedule = doc.data();

    let lastUpdateTime = groupSchedule.lastUpdateTime || doc.updateTime.toMillis() || 0;
    if (currentTime() - lastUpdateTime <= groupScheduleMaxAge && groupSchedule.loaded) return groupSchedule;
    return { ...groupSchedule, ...(await downloadGroupSchedule(groupSchedule)) };
};

// takes an array of group codes as input and returns an array of group schedules data
const getGroupsData = async (inputGroupsCodes) => {
    const groupCodes = Array.from(new Set(inputGroupsCodes));
    let ret = {};
    await Promise.all(
        groupCodes.map(async (groupCode) => {
            try {
                const result = await getGroupSchedule(groupCode);
                ret[groupCode] = { ok: true, result: result };
            } catch (error) {
                ret[groupCode] = { ok: false, error: groupCode + ": " + error.toString() };
            }
        })
    );
    return ret;
};

// takes the parsed course schedule and groups the schedules for the individual tutorials
const getParseCS = (ini) => {
    let ret = {};
    for (let i = 0; i < ini.length; i += 1) {
        for (let j = 0; j < ini[i].ret.length; j += 1) {
            const cell = ini[i].ret[j];
            for (const session of cell) {
                const group = session.group;
                if (ret[group]) {
                    ret[group].push({
                        x: i,
                        y: j,
                        location: session.location,
                        staff: session.staff,
                    });
                } else {
                    ret[group] = [
                        {
                            x: i,
                            y: j,
                            location: session.location,
                            staff: session.staff,
                        },
                    ];
                }
            }
        }
    }
    return ret;
};

// parses the raw HTML to return the course schedule
const parseGetCourseSchedule = (data) => {
    var doc = new JSDOM(data).window.document;
    const ret = Array.from(doc.querySelector("#schedule").firstElementChild.children)
        .slice(1)
        .map((row) => {
            const day = row.children[0].textContent.trim();
            const ret = Array.from(row.children)
                .slice(1)
                .map((cell) => {
                    return Array.from(cell.children).map((s) => {
                        const session = s.firstElementChild;
                        return { group: session.children[1].textContent, location: session.children[3].textContent, staff: session.children[5].textContent };
                    });
                });
            return { ret, day };
        });
    return ret;
};

// returns the courses schedule by requesting it from guc.edu.eg
const downloadCourseScheduleHelper = async (id, viewState, eventValidation) => {
    return doRetries(async () => {
        const formData = qs.stringify({ __VIEWSTATE: viewState, __EVENTVALIDATION: eventValidation, "course[]": id });

        const resp = await ntlm.post({
            username: USERNAME,
            password: PASSWORD,
            url: "http://student.guc.edu.eg/External/LSI/EDUMS/CSMS/SearchAcademicScheduled_001.aspx",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (resp == undefined) {
            throw "getCourseSchedule, result is undefined";
        }

        return getParseCS(parseGetCourseSchedule(resp));
    }, maxCourseScheduleRetries);
    // var event_validation = doc.querySelector("#__EVENTVALIDATION").value;
    // var view_state = doc.querySelector("#__VIEWSTATE").value;
};

// gets the course schedule from the guc website and saves it to the store
const downloadCourseSchedule = async (course) => {
    const { view_state: viewState, event_validation: eventValidation } = await courseScheduleRequestDetails();

    const courseSchedule = await downloadCourseScheduleHelper(course.id, viewState, eventValidation);

    const data = { loaded: true, sched: courseSchedule, lastUpdateTime: currentTime() };

    await admin
        .firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("course_" + course.code)
        .doc("info")
        .set(data, { merge: true });

    functions.logger.info(`downloaded course_schedule ${course.code} with ${Object.keys(courseSchedule).length} tutorials`);
    return data;
};

// returns the course schedule from either the store or calling downloadCourseSchedule
const getCourseData = async (courseCode) => {
    if (!courseCode) throw "invalid course_code";

    const doc = await admin
        .firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("course_" + courseCode)
        .doc("info")
        .get();

    if (!doc.exists) throw "course does not exist";

    const course = doc.data();

    let lastUpdateTime = course.lastUpdateTime || doc.updateTime.toMillis() || 0;
    if (currentTime() - lastUpdateTime <= courseDataMaxAge && course.loaded) return course;
    return { ...course, ...(await downloadCourseSchedule(course)) };
};

const getCoursesData = async (inputCourseCodes) => {
    const courseCodes = Array.from(new Set(inputCourseCodes));
    let ret = {};
    await Promise.all(
        courseCodes.map(async (courseCode) => {
            try {
                const result = await getCourseData(courseCode);
                ret[courseCode] = { ok: true, result: result };
            } catch (error) {
                ret[courseCode] = { ok: false, error: courseCode + ": " + error.toString() };
            }
        })
    );
    return ret;
};

// parses the raw HTML to return the courses that a student takes
const parseGetStudentDataReport = (data) => {
    var doc = new JSDOM(data).window.document;

    if (doc.querySelector("#L_Info1").textContent.trim()) {
        throw "invalid id provided";
    }

    const ret = Array.from(doc.querySelector("#DG_ChangeGroupOffers").firstElementChild.children)
        .slice(1)
        .map((v) => {
            const courseInfo = v.children[0].textContent;
            const groupInfo = v.children[1].textContent;

            const [courseGroupName, courseCombinedName] = courseInfo.split(" - ");
            const [courseCode, courseMatchAlpha, courseMatchNum] = courseCombinedName.match(/^\s*([A-Za-z]+)(\s*[\d]+)/);
            const spIndex = courseCode.length;
            const courseLongName = courseCombinedName.slice(spIndex + 1);
            const tutorialGroup = groupInfo.slice(groupInfo.lastIndexOf(" ") + 1);
            const type = tutorialGroup[0];
            const attendanceGroup = groupInfo.slice(0, groupInfo.lastIndexOf(" ")) + tutorialGroup.slice(1).replace(/^0+/, "");

            let typeName = "";
            if (type == "T") {
                typeName = "Tutorial";
            } else if (type == "L") {
                typeName = "Lecture";
            } else if (type == "P") {
                typeName = "Practical";
            } else {
                typeName = "Unknown";
                functions.logger.error("unknown type", { courseInfo, groupInfo });
            }

            const courseCodeSp = courseMatchAlpha + " " + courseMatchNum;
            const expectedGroup = courseCodeSp + " - " + attendanceGroup + " (" + typeName + ")";

            return { courseCode, type, attendanceGroup, tutorialGroup, expectedGroup, typeName, courseGroupName };
        });
    return ret;
};

// returns the courses a student takes by requesting it from guc.edu.eg
const getStudentDataReport = async (id) => {
    if (!/^\d{1,2}-\d{4,5}$/.test(id)) throw "invalid id";

    return doRetries(async () => {
        const resp = await ntlm.get({
            username: USERNAME,
            password: PASSWORD,
            url: "http://student.guc.edu.eg/External/Student/CourseGroup/StudentDataReport.aspx",
            qs: { StudentAppNo: id },
        });

        if (resp == undefined) throw "getStudentDataReport, result is undefined";

        return parseGetStudentDataReport(resp);
    }, maxDataReportRetries);
};

const combineSessions = (input) => {
    mp = new Map();
    input
        .filter((v) => v)
        .flat()
        .forEach((session) => {
            const key = JSON.stringify([session.x, session.y, session.location]);
            if (!mp.has(key)) mp.set(key, []);
            if (session.staff) mp.get(key).push(session.staff);
        });
    return Array.from(mp.entries()).map((item) => {
        const key = JSON.parse(item[0]);
        return { x: key[0], y: key[1], location: key[2], staff: item[1] };
    });
};

// get_student_schedule called with get request or an option preflight request and returns the student schedule for the provided id
exports.get_student_schedule = functions
    .region("europe-west1")
    .runWith(runtimeOptsGetStudentSchedule)
    .https.onRequest(async (req, res) => {
        const id = req.query.id;
        functions.logger.info(`incoming request from ${req.ip} with id ${id} and method ${req.method}`);
        // handle CORS
        res.set("Access-Control-Allow-Origin", "https://gucschedule.web.app");
        if (req.method === "OPTIONS") {
            // Send response to OPTIONS requests
            res.set("Access-Control-Allow-Methods", "GET");
            res.set("Access-Control-Allow-Headers", "Content-Type");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).send("");
            return;
        } else if (req.method !== "GET") {
            res.status(405).send("");
            return;
        }

        let studentData;

        try {
            studentData = await getStudentDataReport(id);
        } catch (e) {
            functions.logger.warn(`error while getting Student Data Report ${e.toString()}`);
            res.send({ status: "error", error: e });
            return;
        }
        const err = [];
        const result = [];

        const courseCodes = studentData.map((e) => e.courseCode);
        const groups = studentData.map((e) => e.courseGroupName);
        const [courseSchedules, groupSchedules] = await Promise.all([getCoursesData(courseCodes), getGroupsData(groups)]);

        for (const [courseCode, courseInfo] of Object.entries(courseSchedules)) if (!courseInfo.ok) err.push(courseInfo.error);
        for (const [groupCode, groupInfo] of Object.entries(groupSchedules)) if (!groupInfo.ok) err.push(groupInfo.error);

        for (const course of studentData) {
            const courseInfo = courseSchedules[course.courseCode];
            const groupInfo = groupSchedules[course.courseGroupName];
            let data = [];
            if (courseInfo.ok) data.push(courseInfo.result.sched[course.expectedGroup]);
            if (groupInfo.ok) data.push(groupInfo.result.sched[course.expectedGroup]);
            data = combineSessions(data);
            if (data.length)
                result.push({
                    course_code: course.courseCode,
                    tut_group: course.tutorialGroup,
                    type: course.typeName,
                    sessions: data,
                    course_name: courseInfo.result.course_name,
                });
            else err.push(course.courseCode + `;${course.courseGroupName}` + `: group ${course.expectedGroup} not found`);
        }

        const ret = { status: "ok", error: err.join("\n"), data: result };
        res.send(ret);
    });
