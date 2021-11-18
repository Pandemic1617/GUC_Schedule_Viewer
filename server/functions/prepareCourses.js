const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");

const { JSDOM } = require("jsdom");
const { timingSafeEqual } = require("crypto");
const qs = require("qs");
const ntlm = require("request-ntlm-promise");
const { prepareCoursesSecret } = require("./secret.js");
const { runtimeOptsPerpareCourses } = require("./consts");

const USERNAME = functions.config().credentials.username;
const PASSWORD = functions.config().credentials.password;

// parses the raw HTML to return the list of all courses and some constants
const parse_getCourses = (data) => {
    var doc = new JSDOM(data).window.document;

    var event_validation = doc.querySelector("#__EVENTVALIDATION").value; // a constant needed for future requests
    var view_state = doc.querySelector("#__VIEWSTATE").value; // a constant needed for future requests

    var courses_list = JSON.parse(data.match(/<script type=text\/javascript>var courses = (\[.*?\]), tas =/)[1].replace(/\'/g, '"')).map((v) => {
        return {
            id: v.id,
            course_name: v.value,
            course_code: v.value.split(":")[0].replace(/\s/, ""),
        };
    });

    return { courses_list, view_state, event_validation };
};

// returns the list of all courses and some constants
const getCourses = async () => {
    try {
        let resp = await ntlm.get({
            username: USERNAME,
            password: PASSWORD,
            url: "http://student.guc.edu.eg/External/LSI/EDUMS/CSMS/SearchAcademicScheduled_001.aspx",
        });

        if (resp == undefined) {
            throw "getCourses, result is undefined";
        }
        return parse_getCourses(resp);
    } catch (error) {
        throw error;
    }
};

// parses the raw HTML to return the list of all courses and some constants
const parse_getGroupSchedules = (data) => {
    var doc = new JSDOM(data).window.document;

    const event_validation = doc.querySelector("#__EVENTVALIDATION").value; // a constant needed for future requests
    const view_state = doc.querySelector("#__VIEWSTATE").value; // a constant needed for future requests

    const groupSchedules = Array.from(doc.querySelector("#scdTpLst").children)
        .slice(1)
        .reduce((acc, c) => {
            const value = c.getAttribute("value"),
                originalName = c.textContent,
                name = originalName.slice(0, originalName.lastIndexOf(" "));
            if (acc[name]) acc[name].push(value);
            else acc[name] = [value];
            return acc;
        }, {});

    return { groupSchedules, view_state, event_validation };
};

const getGroupSchedules = async () => {
    try {
        let resp = await ntlm.get({
            username: USERNAME,
            password: PASSWORD,
            url: "http://student.guc.edu.eg/Web/Student/Schedule/GeneralGroupSchedule.aspx",
        });

        if (resp == undefined) {
            throw "getCourses, result is undefined";
        }
        return parse_getGroupSchedules(resp);
    } catch (error) {
        throw error;
    }
};

// prepare_courses initializes the store by creating a collection for each course and saving constants needed for further requests
exports.prepare_courses = functions
    .region("europe-west1")
    .runWith(runtimeOptsPerpareCourses)
    .https.onRequest(async (req, res) => {
        let key = req.query.key;
        if (!timingSafeEqual(Buffer.from(key), Buffer.from(prepareCoursesSecret))) {
            res.status(500).send({ error: "whatcha doin" });
            return;
        }

        const loaded = req.query.loaded == "true";

        const resultCourses = await getCourses();
        const coursesWriteResult = await admin
            .firestore()
            .collection("schedules")
            .doc("get_courses_info")
            .set({ request_details: { event_validation: resultCourses.event_validation, view_state: resultCourses.view_state } }, { merge: true });

        const resultGroupSchedules = await getGroupSchedules();
        const groupSchedulesWriteResult = await admin
            .firestore()
            .collection("schedules")
            .doc("get_group_schedules_info")
            .set({ request_details: { event_validation: resultGroupSchedules.event_validation, view_state: resultGroupSchedules.view_state } }, { merge: true });

        const coursesPromises = resultCourses.courses_list.map((course) => {
            let doc = admin
                .firestore()
                .collection("schedules")
                .doc("student_schedules")
                .collection("course_" + course.course_code)
                .doc("info");

            const base = { id: course.id, course_name: course.course_name, code: course.course_code };
            if (!loaded) doc = doc.set({ loaded, ...base }, { merge: true });
            else doc = doc.set(base, { merge: true });
            return doc;
        });

        const groupSchedulesPromises = Object.entries(resultGroupSchedules.groupSchedules).map(([group, values]) => {
            let doc = admin
                .firestore()
                .collection("schedules")
                .doc("student_schedules")
                .collection("group_" + group)
                .doc("info");
            const base = { id: values, group_name: group };
            if (!loaded) doc = doc.set({ loaded, ...base }, { merge: true });
            else doc = doc.set(base, { merge: true });
            return doc;
        });

        let done = await Promise.all([...coursesPromises, ...groupSchedulesPromises]);

        res.send("done :)");
    });
