import Swal from "sweetalert2";
import axios from "axios";
import { logEvent } from "./analytics.js";
import withReactContent from "sweetalert2-react-content";
import { ApiUrl } from "./consts.js";
import _ from "lodash";
import { disclaimerText, currentDisclaimerVersion, idRegex } from "./consts";

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

// checks if the disclaimer hasn't been accpeted it prompts the user to accept it
const checkDisclaimer = () => {
    if (localStorage.getItem("disclaimer_seen") >= currentDisclaimerVersion) return;

    showAlert("Disclaimer", disclaimerText, { backdrop: true, allowOutsideClick: () => false, dontEscape: true }).then((e) => {
        if (e.isConfirmed) localStorage.setItem("disclaimer_seen", currentDisclaimerVersion);
    });
};

const downloadSchedule = async (id) => {
    console.debug("getSchedule is called with", id);
    if (!idRegex.test(id)) {
        logEvent("Load Scheudle", { type: "Error", result: "invalid id provided (internal)" });
        throw new Error("invalid id provided");
    }

    const a = await axios.get(ApiUrl, { params: { id } }).catch((e) => {
        console.error("exception in getScheudle", e.toString());
        logEvent("Load Scheudle", { type: "Error while making request", result: e.toString() });
        throw new Error(e.toString());
    });

    if (a.data.status !== "ok") {
        logEvent("Load Scheudle", { type: a.data.status, result: a.data.error });
        throw new Error(a.data.error);
    }

    let warning = { title: "", description: "" };
    if (a.data.error) {
        logEvent("Load Scheudle", { type: "Warning", result: a.data.error });
        warning = { title: "Warning", description: a.data.error };
    } else {
        logEvent("Load Scheudle", { type: "ok", result: "successful request" });
    }

    return { scheduleData: a.data.data, warning };
};

export { escapeHTML, parseScheudle, showAlert, checkDisclaimer, downloadSchedule };
