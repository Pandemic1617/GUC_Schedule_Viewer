const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");

const { JSDOM } = require("jsdom");

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
            course_code: v.value.split(":")[0].replace(/\s/g, ""),
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

// prepare_courses initializes the store by creating a collection for each course and saving constants needed for further requests
exports.prepare_courses = functions
    .region("europe-west1")
    .runWith(runtimeOptsPerpareCourses)
    .https.onRequest(async (req, res) => {
        let key = req.query.key;
        if (key != prepareCoursesSecret) {
            res.status(500).send({ error: "whatcha doin" });
            return;
        }

        const loaded = req.query.loaded == "true";
        let result_courses = await getCourses();
        let courses_list = result_courses.courses_list;
        console.log("get courses done");

        let writeResult = await admin
            .firestore()
            .collection("schedules")
            .doc("get_courses_info")
            .set({ request_details: { event_validation: result_courses.event_validation, view_state: result_courses.view_state } }, { merge: true });
        courses_promises = courses_list.map((course) => {
            let doc = admin
                .firestore()
                .collection("schedules")
                .doc("student_schedules")
                .collection("course_" + course.course_code)
                .doc("info");
            if (!loaded) doc = doc.set({ loaded, id: course.id, course_name: course.course_name, code: course.course_code }, { merge: true });
            else doc = doc.set({ id: course.id, course_name: course.course_name, code: course.course_code }, { merge: true });
            return doc;
        });

        let done = await Promise.all(courses_promises);

        res.send("done :)");
    });
