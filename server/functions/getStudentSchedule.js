const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { JSDOM } = require('jsdom');
const qs = require('qs');
const { USERNAME, PASSWORD } = require('./credentials.js');
const ntlm = require('request-ntlm-promise');

const max_retries = 4;

const runtimeOpts_get_student_schedule = {
    timeoutSeconds: 120,
    memory: '1GB'
}

const getParseCS = (ini) => {
    let ret = {};
    for (let i = 0; i < ini.length; i += 1) {
        for (let j = 0; j < ini[i].ret.length; j += 1) {
            let cell = ini[i].ret[j];
            for (const session of cell) {
                let group = session.group;
                if (ret[group]) {
                    ret[group].push({
                        x: i, y: j, location: session.location, staff: session.staff
                    });
                } else {
                    ret[group] = [{
                        x: i, y: j, location: session.location, staff: session.staff
                    }];
                }
            }
        }
    }
    return ret;
}

const parse_getCourseSchedule = (data) => {

    var doc = (new JSDOM(data)).window.document;
    let ret = Array.from(doc.querySelector("#schedule").firstElementChild.children).slice(1).map(row => {
        let day = row.children[0].textContent.trim();
        let ret = Array.from(row.children).slice(1).map(cell => {
            return Array.from(cell.children).map(s => {
                let session = s.firstElementChild;
                return { 'group': session.children[1].textContent, 'location': session.children[3].textContent, 'staff': session.children[5].textContent };
            })
        }); return { ret, day };
    });
    return ret;

}



const downloadCourseScheduleHelper = async (id, oview_state, oevent_validation) => {
    let retries = 0;
    while (true) {
        try {
            const form_data = qs.stringify({ '__VIEWSTATE': oview_state, '__EVENTVALIDATION': oevent_validation, 'course[]': id });

            let resp = await ntlm.post({
                username: USERNAME,
                password: PASSWORD,
                url: "http://student.guc.edu.eg/External/LSI/EDUMS/CSMS/SearchAcademicScheduled_001.aspx",
                headers: { "Content-Type": "application/x-www-form-urlencoded", },
                body: form_data,
            });


            if (resp == undefined) {
                throw "getCourseSchedule, result is undefined";
            }

            return getParseCS(parse_getCourseSchedule(resp));

        } catch (error) {
            console.log(`getCourseSchedule, try: ${retries}, error: ${error.toString()}`);
            retries += 1;
            if (retries <= max_retries) continue;
            throw error
        }
    }
    // var event_validation = doc.querySelector("#__EVENTVALIDATION").value;
    // var view_state = doc.querySelector("#__VIEWSTATE").value;
}

const downloadCourseSchedule = async (course) => {
    let request_details = (await admin.firestore().collection('schedules').doc('get_courses_info').get()).data().request_details;

    let tut_schedule = await downloadCourseScheduleHelper(course.id, request_details.view_state, request_details.event_validation);
    let tut_groups_promises = []
    for (const [e_group, sched] of Object.entries(tut_schedule)) {
        tut_groups_promises.push(admin.firestore().collection('schedules').doc('student_schedules').collection('course_' + course.code).doc('group_' + e_group).set({ sched }));
    }

    let done = await Promise.all(tut_groups_promises);
    console.log("done downloading new course", done.length);
    admin.firestore().collection('schedules').doc('student_schedules').collection('course_' + course.code).doc('info').set({ loaded: true }, { merge: true });
    return;

}


const getCourseSchedule = async (course_code, e_group) => {

    if (!course_code || !e_group) throw 'invalid course_code or e_group';
    let course;

    let doc = await admin.firestore().collection('schedules').doc('student_schedules').collection('course_' + course_code).doc('info').get();
    if (!doc.exists) throw 'course does not exist';
    course = doc.data();


    if (!course.loaded) {
        await downloadCourseSchedule(course);
    }

    let data = admin.firestore().collection('schedules').doc('student_schedules').collection('course_' + course_code).doc('group_' + e_group).get().then(doc => {
        if (!doc.exists) throw 'e_group does not exist';
        return doc.data().sched;
    }).catch(e => { throw e; })
    return data;
}

const parse_getStudentDataReport = (data) => {
    var doc = (new JSDOM(data)).window.document;

    if (doc.querySelector("#L_Info1").textContent.trim()) {
        throw 'invalid id provided';
    }

    let ret = Array.from(doc.querySelector("#DG_ChangeGroupOffers").firstElementChild.children).slice(1).map(v => {
        let a = v.children[0].textContent;
        let b = v.children[1].textContent;
        let temp = a.split(' - ');
        temp = temp[temp.length - 1];
        temp = temp.trim().split(' ').filter(e => e);
        let course_code = a.slice(a.lastIndexOf('-') + 1).trim().split(' ')[0];
        temp = b.split(' ').filter(e => e);
        temp = temp.slice(temp.length - 2);
        let type = b.slice(b.lastIndexOf(' ')).trim()[0];
        let tutorial_group = temp[1];
        let attendance_group = b.slice(0, b.lastIndexOf(' ')) + parseInt(temp[1].slice(1)).toString()

        let type_name = ""
        if (type == 'T') {
            type_name = "Tutorial"
        } else if (type == 'L') {
            type_name = "Lecture"
        } else if (type == 'P') {
            type_name = "Practical"
        }

        let course_match = course_code.match(/([A-Za-z]+)([\d]+)/);
        let course_code_sp = course_match[1] + " " + course_match[2];
        let expected_group = course_code_sp + " - " + attendance_group + " (" + type_name + ")";

        return { course_code, type, attendance_group, tutorial_group, expected_group, type_name };
    });
    return ret;
}

const getStudentDataReport = async (id) => {

    if (!(/\d{1,2}-\d{4,5}/.test(id))) throw "invalid id";

    let retries = 0;
    while (true) {
        try {

            let resp = await ntlm.get({
                username: USERNAME,
                password: PASSWORD,
                url: "http://student.guc.edu.eg/External/Student/CourseGroup/StudentDataReport.aspx",
                qs: { "StudentAppNo": id }
            });

            if (resp == undefined) {
                throw "getStudentDataReport, result is undefined";
            }

            return parse_getStudentDataReport(resp);
        } catch (error) {
            console.log(`getStudentDataReport, try: ${retries}, error: ${error.toString()}`);
            retries += 1;
            if (retries <= max_retries) continue;
            throw error;
        }
    }
}

exports.get_student_schedule = functions.region('europe-west1').runWith(runtimeOpts_get_student_schedule).https.onRequest(async (req, res) => {
    let id = req.query.id;
    let student_data;

    try {
        student_data = await getStudentDataReport(id);
    } catch (e) {
        console.log("in getStudentSchedule", e);
        res.send({ status: "error", error: e });
        return;
    }
    let err = "";
    let result = [];
    let done = []

    for (let course of student_data) {
        let func = async () => {
            let a;
            try {
                a = await getCourseSchedule(course.course_code, course.expected_group);
                result.push({ course_code: course.course_code, tut_group: course.tutorial_group, type: course.type_name, sessions: a });
            } catch (e) {
                err += course.course_code + " " + course.type_name + ": " + e + '\n';
            }
        };
        done.push(func);
    }

    await Promise.all(done.map(fn => fn()));

    let ret = { status: "ok", error: err, data: result };
    res.send(ret);
});