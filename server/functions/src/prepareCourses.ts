const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");

import { JSDOM } from "jsdom";
import { timingSafeEqual } from "crypto";
const { runtimeOptsPerpareCourses } = require("./consts");

import { academicScheduleUrl, generalGroupScheduleUrl } from "./consts";
import { doGetRequest } from "./requests";
import { getCoursesInfoFirestore, getGroupsInfoFirestore, courseFirestore, groupFirestore } from "./firestore";

// parses the raw HTML to return the list of all courses and some constants
const parseCourses = (data: string) => {
    const doc = new JSDOM(data).window.document;

    const event_validation = (doc.querySelector("#__EVENTVALIDATION") as HTMLInputElement)?.value; // a constant needed for future requests
    const view_state = (doc.querySelector("#__VIEWSTATE") as HTMLInputElement)?.value; // a constant needed for future requests

    const matchResult = data.match(/<script type=text\/javascript>var courses = (\[.*?\]), tas =/);

    if (matchResult == null) {
        throw "parse_getCourses, matchResult is null";
    }

    const courses_list: { id: string; course_name: string; course_code: string }[] = JSON.parse(
        matchResult[1].replace(/\'/g, '"')
    ).map((v: { id: string; value: string }) => {
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
    const rawAcademicSchedule = await doGetRequest({ url: academicScheduleUrl });

    return parseCourses(rawAcademicSchedule);
};

// parses the raw HTML to return the list of all courses and some constants
const parseGroupSchedules = (data: string) => {
    const doc = new JSDOM(data).window.document;

    const event_validation = (doc.querySelector("#__EVENTVALIDATION") as HTMLInputElement)?.value; // a constant needed for future requests
    const view_state = (doc.querySelector("#__VIEWSTATE") as HTMLInputElement)?.value; // a constant needed for future requests

    const children = doc.querySelector("#scdTpLst")?.children;
    if (!children) throw "parseGroupSchedules, children is null";
    const groupSchedules = Array.from(children)
        .slice(1)
        .reduce(
            (acc, c) => {
                const value = c.getAttribute("value");
                const originalName = c.textContent;
                if (!originalName || !value) return acc;
                const name = originalName.slice(0, originalName.lastIndexOf(" "));
                if (!acc[name]) acc[name] = [];
                acc[name].push(value);
                return acc;
            },
            {} as { [groupName: string]: string[] }
        );

    return { groupSchedules, view_state, event_validation };
};

const getGroupSchedules = async () => {
    const rawGroupSchedules = await doGetRequest({ url: generalGroupScheduleUrl });

    return parseGroupSchedules(rawGroupSchedules);
};

export const prepareCourses = async ({ loaded }: { loaded: boolean }) => {
    const [resultCourses, resultGroupSchedules] = await Promise.all([getCourses(), getGroupSchedules()]);

    const coursesWritePromise = getCoursesInfoFirestore().set(
        {
            request_details: {
                event_validation: resultCourses.event_validation,
                view_state: resultCourses.view_state,
            },
        },
        { merge: true }
    );

    const groupSchedulesWritePromise = getGroupsInfoFirestore().set(
        {
            request_details: {
                event_validation: resultGroupSchedules.event_validation,
                view_state: resultGroupSchedules.view_state,
            },
        },
        { merge: true }
    );

    const coursesPromises = resultCourses.courses_list.map((course) => {
        let doc = courseFirestore(course.course_code);
        const base = {
            id: course.id,
            course_name: course.course_name,
            code: course.course_code,
        };

        const data = loaded ? base : { loaded, ...base };
        return doc.set(data, { merge: true });
    });

    const groupSchedulesPromises = Object.entries(resultGroupSchedules.groupSchedules).map(([group, values]) => {
        let doc = groupFirestore(group);
        const base = { id: values, group_name: group };
        const data = loaded ? base : { loaded, ...base };
        return doc.set(data, { merge: true });
    });

    await Promise.all([coursesWritePromise, groupSchedulesWritePromise, ...coursesPromises, ...groupSchedulesPromises]);

    return;
};

// prepare_courses initializes the store by creating a collection for each course and saving constants needed for further requests
// exports.prepare_courses = functions
//     .region("europe-west1")
//     .runWith(runtimeOptsPerpareCourses)
//     .https.onRequest(async (req, res) => {
//         let key = req.query.key;
//         if (!timingSafeEqual(Buffer.from(key), Buffer.from(prepareCoursesSecret))) {
//             res.status(500).send({ error: "whatcha doin" });
//             return;
//         }

//         const loaded = req.query.loaded == "true";

//         const resultCourses = await getCourses();
//         const coursesWriteResult = await admin
//             .firestore()
//             .collection("schedules")
//             .doc("get_courses_info")
//             .set(
//                 {
//                     request_details: {
//                         event_validation: resultCourses.event_validation,
//                         view_state: resultCourses.view_state,
//                     },
//                 },
//                 { merge: true }
//             );

//         const resultGroupSchedules = await getGroupSchedules();
//         const groupSchedulesWriteResult = await admin
//             .firestore()
//             .collection("schedules")
//             .doc("get_group_schedules_info")
//             .set(
//                 {
//                     request_details: {
//                         event_validation: resultGroupSchedules.event_validation,
//                         view_state: resultGroupSchedules.view_state,
//                     },
//                 },
//                 { merge: true }
//             );

//         const coursesPromises = resultCourses.courses_list.map((course) => {
//             let doc = admin
//                 .firestore()
//                 .collection("schedules")
//                 .doc("student_schedules")
//                 .collection("course_" + course.course_code)
//                 .doc("info");

//             const base = {
//                 id: course.id,
//                 course_name: course.course_name,
//                 code: course.course_code,
//             };
//             if (!loaded) doc = doc.set({ loaded, ...base }, { merge: true });
//             else doc = doc.set(base, { merge: true });
//             return doc;
//         });

//         const groupSchedulesPromises = Object.entries(resultGroupSchedules.groupSchedules).map(([group, values]) => {
//             let doc = admin
//                 .firestore()
//                 .collection("schedules")
//                 .doc("student_schedules")
//                 .collection("group_" + group)
//                 .doc("info");
//             const base = { id: values, group_name: group };
//             if (!loaded) doc = doc.set({ loaded, ...base }, { merge: true });
//             else doc = doc.set(base, { merge: true });
//             return doc;
//         });

//         let done = await Promise.all([...coursesPromises, ...groupSchedulesPromises]);

//         res.send("done :)");
//     });
