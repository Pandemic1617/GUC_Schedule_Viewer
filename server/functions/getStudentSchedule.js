const functions = require("firebase-functions");
const admin = require("firebase-admin");

const { JSDOM } = require("jsdom");
const qs = require("qs");
const ntlm = require("request-ntlm-promise");

const lazyVariable = require("./lazy.js").lazyVariable;

const USERNAME = functions.config().credentials.username;
const PASSWORD = functions.config().credentials.password;

const max_retries = 4;

const runtimeOpts_get_student_schedule = {
    timeoutSeconds: 120,
    memory: "1GB",
};

const request_details = lazyVariable(async () => {
    return (await admin.firestore().collection("schedules").doc("get_courses_info").get()).data().request_details;
});

// takes a the parsed course schedule and groups the scheudles for the individual tutorials
const getParseCS = (ini) => {
    let ret = {};
    for (let i = 0; i < ini.length; i += 1) {
        for (let j = 0; j < ini[i].ret.length; j += 1) {
            let cell = ini[i].ret[j];
            for (const session of cell) {
                let group = session.group;
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

// parses the raw HTML to return the course scheudle
const parse_getCourseSchedule = (data) => {
    var doc = new JSDOM(data).window.document;
    let ret = Array.from(doc.querySelector("#schedule").firstElementChild.children)
        .slice(1)
        .map((row) => {
            let day = row.children[0].textContent.trim();
            let ret = Array.from(row.children)
                .slice(1)
                .map((cell) => {
                    return Array.from(cell.children).map((s) => {
                        let session = s.firstElementChild;
                        return { group: session.children[1].textContent, location: session.children[3].textContent, staff: session.children[5].textContent };
                    });
                });
            return { ret, day };
        });
    return ret;
};

// returns the courses scheudle by requesting it from guc.edu.eg
const downloadCourseScheduleHelper = async (id, oview_state, oevent_validation) => {
    let retries = 0;
    while (true) {
        try {
            const form_data = qs.stringify({ __VIEWSTATE: oview_state, __EVENTVALIDATION: oevent_validation, "course[]": id });

            let resp = await ntlm.post({
                username: USERNAME,
                password: PASSWORD,
                url: "http://student.guc.edu.eg/External/LSI/EDUMS/CSMS/SearchAcademicScheduled_001.aspx",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: form_data,
            });

            if (resp == undefined) {
                throw "getCourseSchedule, result is undefined";
            }

            return getParseCS(parse_getCourseSchedule(resp));
        } catch (error) {
            functions.logger.warn(`getCourseSchedule, try: ${retries}, error: ${error.toString()}`);
            retries += 1;
            if (retries <= max_retries) continue;
            throw error;
        }
    }
    // var event_validation = doc.querySelector("#__EVENTVALIDATION").value;
    // var view_state = doc.querySelector("#__VIEWSTATE").value;
};

// gets the course scheudle from the guc website and saves it to the store
const downloadCourseSchedule = async (course) => {
    let { view_state, event_validation } = await request_details();

    let tut_schedule = await downloadCourseScheduleHelper(course.id, view_state, event_validation);

    let done = await Promise.all([
        admin
            .firestore()
            .collection("schedules")
            .doc("student_schedules")
            .collection("course_" + course.code)
            .doc("groups0")
            .set({ sched: tut_schedule }),
        admin
            .firestore()
            .collection("schedules")
            .doc("student_schedules")
            .collection("course_" + course.code)
            .doc("info")
            .set({ loaded: true }, { merge: true }),
    ]);
    functions.logger.info(`downloaded ${course.code} with ${Object.keys(tut_schedule).length} tutorials`);
    return tut_schedule;
};

// returns the course schedule from either the store or calling downloadCourseSchedule
const getCourseSchedule = async (course_code) => {
    if (!course_code) throw "invalid course_code";
    let course;

    let doc = await admin
        .firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("course_" + course_code)
        .doc("info")
        .get(); // check this once per course since the same course is called for T,P,L
    if (!doc.exists) throw "course does not exist";
    course = doc.data();

    if (!course.loaded) {
        return await downloadCourseSchedule(course); // return info from this function rather than getting the data from firestore again
    }

    let data = admin
        .firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("course_" + course_code)
        .doc("groups0")
        .get()
        .then((doc) => {
            if (!doc.exists) throw "course_loaded but groups0 doesn't exist";
            return doc.data().sched;
        })
        .catch((e) => {
            throw e;
        });
    return data;
};

const getCoursesScheudles = async (input_course_codes) => {
    let course_codes = Array.from(new Set(input_course_codes));
    let ret = {};
    await Promise.all(
        course_codes.map(async (course_code) => {
            try {
                let result = await getCourseSchedule(course_code);
                ret[course_code] = { ok: true, result: result };
            } catch (error) {
                ret[course_code] = { ok: false, error: course_code + ": " + error.toString() };
            }
        })
    );
    return ret;
};

// parses the raw HTML to return the courses that a student takes
const parse_getStudentDataReport = (data) => {
    var doc = new JSDOM(data).window.document;

    if (doc.querySelector("#L_Info1").textContent.trim()) {
        throw "invalid id provided";
    }

    let ret = Array.from(doc.querySelector("#DG_ChangeGroupOffers").firstElementChild.children)
        .slice(1)
        .map((v) => {
            let courseInfo = v.children[0].textContent;
            let groupInfo = v.children[1].textContent;

            let course_combined_name = courseInfo.slice(courseInfo.lastIndexOf(" - ") + 3).trim();
            let course_code = course_combined_name.slice(0, course_combined_name.indexOf(" "));
            let course_long_name = course_combined_name.slice(course_combined_name.indexOf(" ") + 1);
            let tutorial_group = groupInfo.slice(groupInfo.lastIndexOf(" ") + 1);
            let type = tutorial_group[0];
            let attendance_group = groupInfo.slice(0, groupInfo.lastIndexOf(" ")) + tutorial_group.slice(1).replace(/^0+/, "");

            let type_name = "";
            if (type == "T") {
                type_name = "Tutorial";
            } else if (type == "L") {
                type_name = "Lecture";
            } else if (type == "P") {
                type_name = "Practical";
            } else {
                type_name = "Unknown";
                functions.logger.error("unkown type", { courseInfo, groupInfo });
            }

            let course_match = course_code.match(/^([A-Za-z]+)([\d]+)$/);
            if (course_match.length !== 3) {
                functions.logger.error("course_match.length is not 3", { courseInfo, groupInfo });
            }
            let course_code_sp = course_match[1] + " " + course_match[2];
            let expected_group = course_code_sp + " - " + attendance_group + " (" + type_name + ")";

            return { course_code, type, attendance_group, tutorial_group, expected_group, type_name };
        });
    return ret;
};

// returns the courses a student takes by requesting it from guc.edu.eg
const getStudentDataReport = async (id) => {
    if (!/^\d{1,2}-\d{4,5}$/.test(id)) throw "invalid id";

    let retries = 0;
    while (true) {
        try {
            let resp = await ntlm.get({
                username: USERNAME,
                password: PASSWORD,
                url: "http://student.guc.edu.eg/External/Student/CourseGroup/StudentDataReport.aspx",
                qs: { StudentAppNo: id },
            });

            if (resp == undefined) {
                throw "getStudentDataReport, result is undefined";
            }

            return parse_getStudentDataReport(resp);
        } catch (error) {
            functions.logger.warn(`getStudentDataReport, try: ${retries}, error: ${error.toString()}`);
            retries += 1;
            if (retries <= max_retries) continue;
            throw error;
        }
    }
};

// get_student_scheudle called with get request or an option preflight request and returns the student schedule for the provided id
exports.get_student_schedule = functions
    .region("europe-west1")
    .runWith(runtimeOpts_get_student_schedule)
    .https.onRequest(async (req, res) => {
        let id = req.query.id;
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

        let student_data;

        try {
            student_data = await getStudentDataReport(id);
        } catch (e) {
            functions.logger.error(`error while getting Student Data Report ${e.toString()}`);
            res.send({ status: "error", error: e });
            return;
        }
        let err = [];
        let result = [];

        let course_codes = student_data.map((e) => e.course_code);
        let course_schedules = await getCoursesScheudles(course_codes);

        for (let course of student_data) {
            let course_info = course_schedules[course.course_code];
            if (course_info.ok) {
                if (course_info.result[course.expected_group] != undefined)
                    result.push({ course_code: course.course_code, tut_group: course.tutorial_group, type: course.type_name, sessions: course_info.result[course.expected_group] });
                else err.push(course.course_code + `: group ${course.expected_group} not found`);
            } else {
                err.push(course.course_code + ": " + course_info.error);
            }
        }

        let ret = { status: "ok", error: err.join("\n"), data: result };
        res.send(ret);
    });
