const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

const { JSDOM } = require('jsdom');

const qs = require('qs');
const ntlm = require('request-ntlm-promise');
const { USERNAME, PASSWORD } = require('./credentials.js');
const { prepareCoursesSecret } = require('./secret.js');


function parse_getCourses(data) {
    var doc = (new JSDOM(data)).window.document;

    var event_validation = doc.querySelector("#__EVENTVALIDATION").value;
    var view_state = doc.querySelector("#__VIEWSTATE").value;

    var courses_list = JSON.parse(data.match(/<script type=text\/javascript>var courses = (\[.*?\]), tas =/)[1].replace(/\'/g, '\"')).map(v => {
        return {
            id: v.id,
            course_name: v.value,
            course_code: v.value.split(':')[0].replace(/\s/g, '')
        }
    });

    return { courses_list, view_state, event_validation };
}

const getCourses = () => {
    return new Promise(async (resolve, reject) => {
        try {

            let resp = await ntlm.get({
                username: USERNAME,
                password: PASSWORD,
                url: "http://student.guc.edu.eg/External/LSI/EDUMS/CSMS/SearchAcademicScheduled_001.aspx",
            });

            if (resp == undefined) {
                throw "getCourses, result is undefined";
            }
            resolve(parse_getCourses(resp));
            return;
        } catch (error) {
            reject(error)
        }
    });
}

const runtimeOpts_perpare_courses = {
    timeoutSeconds: 540,
    memory: '1GB'
}

exports.prepare_courses = functions.region('europe-west1').runWith(runtimeOpts_perpare_courses).https.onRequest(async (req, res) => {

    let key = req.query.key;
    if (key != prepareCoursesSecret) { res.status(500).send({ error: 'whatcha doing' }); return; }
    let result_courses = await getCourses();
    let courses_list = result_courses.courses_list;

    let writeResult = await admin.firestore().collection('schedules').doc('get_courses_info').set(
        { request_details: { event_validation: result_courses.event_validation, view_state: result_courses.view_state } },
        { merge: true }
    );
    courses_promises = courses_list.map(course => admin.firestore().collection('schedules').doc('student_schedules').collection('course_' + course.course_code).doc('info').set(
        { loaded: false, id: course.id, course_name: course.course_name, code: course.course_code },
        { merge: true }
    ));

    let done = await Promise.all(courses_promises);

    res.send('done :)');
});