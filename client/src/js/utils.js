import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import _, { toLower, toUpper } from "lodash";
let escapeHTML = (text) => {
    let a = document.createElement("div");
    a.appendChild(document.createTextNode(text));
    return a.innerHTML;
};

// parses the schedule input as given from the api into an array ready to be rendered
let parseScheudle = (inSched) => {
    let out = new Array(7).fill(0).map((e) => {
        return new Array(5).fill(0).map((e) => []);
    });

    for (let course of inSched) {
        for (let session of course.sessions) {
            let ret = {};

            ret.courseCode = course.course_code;
            ret.courseName = course.course_name || "";
            ret.type = course.type;
            ret.tutorialGroup = course.tut_group;
            ret.location = session.location;
            ret.staff = session.staff;

            out[session.x][session.y].push(ret); // maybe y >=5 ie. something after the 5th session
        }
    }

    let cnt = Array(7).fill(0);
    for (let i = 0; i < out.length; i++) for (let blah of out[i]) cnt[i] += blah.length;

    if (cnt[6] === 0) out.pop();
    console.debug("parseSchedule", out);
    return out;
};

const MySwal = withReactContent(Swal);

const showAlert = (type, info = "", obj = {}) => {
    console.debug("displayed alert");
    return MySwal.fire({
        title: '<span style="color:var(--color3)">' + escapeHTML(type) + "</span>",
        html: '<span style="color:var(--text-color);white-space: pre-wrap">' + (obj.dontEscape ? info : escapeHTML(info)) + "</span>",
        background: "var(--background)",
        confirmButtonColor: "var(--color3)",
        confirmButtonText: '<span style="color:var(--background)">OK</span>',
        ..._.omit(obj, "dontEscape"),
    });
};

const camelToSpace = (camelString) => [...camelString].map((c, i) => (i && c === toLower(c) ? c : " " + toUpper(c))).join('').trim();

export { escapeHTML, parseScheudle, showAlert, camelToSpace };
