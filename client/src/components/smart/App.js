import "./App.css";
import React from "react";
import axios from "axios";

import Schedule from "./Schedule";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { analytics } from "../../js/analytics.js";
import { escapeHTML } from "../../js/utils.js";

const MySwal = withReactContent(Swal);
const current_disclaimer_version = 1;
const API_URL = "https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule";

const disclaimer_text =
    "This app comes with absolutely no warranties or guarantees. You are solely responsible for the use of this app and should only use it on people who have given you permission. This app merely uses information available to any GUC student through the admin system. This is an app made by a GUC student and is in no way endorsed by the GUC.";

const themes = ["theme-dark", "theme-light"];

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sched: [],
            id: "",
        };
        this.getButton = React.createRef();

        this.initTheme();
        this.checkDisclaimer();
    }

    initTheme = () => {
        let currentTheme = localStorage.getItem("theme_choice");
        if (currentTheme == null) currentTheme = 0;
        this.setTheme(currentTheme, false);
    };

    setTheme = (newTheme, save = true) => {
        if (save) localStorage.setItem("theme_choice", newTheme);
        document.documentElement.classList.add(themes[newTheme]);
        this.currentTheme = newTheme;
    };

    switchTheme = () => {
        document.documentElement.classList.remove(themes[this.currentTheme]);
        this.setTheme((this.currentTheme + 1) % themes.length);
    };

    checkDisclaimer = () => {
        if (localStorage.getItem("disclaimer_seen") >= current_disclaimer_version) return;

        this.onShowAlert("Disclaimer", disclaimer_text, { backdrop: true, allowOutsideClick: () => false }).then((e) => {
            if (e.isConfirmed) localStorage.setItem("disclaimer_seen", current_disclaimer_version);
        });

        return;
    };

    onGetClick = async () => {
        let id = this.state.id;
        let a = this.getButton.current;
        if (a.disabled === true) return;
        this.setState({ sched: [] });
        a.disabled = true;
        this.getSchedule(id).then((e) => {
            a.disabled = false;
        });
    };

    getSchedule = async (id) => {
        console.debug("getSchedule is called with", id);
        if (!/^\d{1,2}-\d{4,5}$/.test(id)) {
            this.onShowAlert("Error", "invalid id provided");
            analytics.logEvent("Load Scheudle", { id, type: "Error", result: "invalid id provided (internal)" });
            return;
        }

        let a;
        try {
            a = await axios.get(API_URL, { params: { id } });
        } catch (e) {
            console.error("exception in getScheudle", e.toString());
            this.onShowAlert("Error while making request", e.toString());
            analytics.logEvent("Load Scheudle", { id, type: "Error while making request", result: e.toString() });
            return;
        }

        if (a.data.status !== "ok") {
            this.onShowAlert(a.data.status, a.data.error);
            analytics.logEvent("Load Scheudle", { id, type: a.data.status, result: a.data.error });
            return;
        }

        if (a.data.error) {
            this.onShowAlert("Warning", a.data.error);
            analytics.logEvent("Load Scheudle", { id, type: "Warning", result: a.data.error });
        } else {
            analytics.logEvent("Load Scheudle", { id, type: "ok", result: "not error from request" });
        }

        this.setState({ sched: a.data.data });
    };

    updateID = (a) => {
        let value = a.target.value;
        this.setState({ id: value });
        let button = this.getButton.current;
        if (/^\d{1,2}-\d{4,5}$/.test(value)) {
            button.setAttribute("ready", "");
        } else button.removeAttribute("ready");
    };

    onShowAlert = (type, info = "", obj = {}) => {
        console.debug("displayed alert");
        return MySwal.fire({
            title: '<span style="color:var(--color3)">' + escapeHTML(type) + "</span>",
            html: '<span style="color:var(--text-color)">' + escapeHTML(info) + "</span>",
            background: "var(--background)",
            confirmButtonColor: "var(--color3)",
            confirmButtonText: '<span style="color:var(--background)">OK</span>',
            ...obj,
        });
    };

    keyUpListener = (e) => {
        if (e.keyCode !== 13) return;
        this.onGetClick();
    };

    onThemeChange = () => {
        this.switchTheme();
    };

    render() {
        return (
            <div className="App">
                <div id="name"> GUC Schedule Viewer</div>
                <input id="id" type="text" placeholder="Enter GUC ID" onChange={this.updateID} onKeyUp={this.keyUpListener}></input>
                <br></br>
                <button id="get" onClick={this.onGetClick} ref={this.getButton}>
                    Load Schedule
                </button>
                <Schedule schedule={this.state.sched} key={this.state.sched} />
                <button id="theme_change" onClick={this.onThemeChange}>
                    Change Theme
                </button>
            </div>
        );
    }
}

export default App;
