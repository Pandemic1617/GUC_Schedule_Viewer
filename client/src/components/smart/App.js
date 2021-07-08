import "./App.css";
import React from "react";
import axios from "axios";

import Schedule from "../visual/Schedule";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { analytics } from "../../js/analytics.js";
import { escapeHTML } from "../../js/utils.js";
import ChangeTheme from "./ChangeTheme.js";
import { currentDisclaimerVersion, ApiUrl, disclaimerText } from "../../js/consts.js";

const MySwal = withReactContent(Swal);

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sched: [],
            id: "",
        };
        this.getButton = React.createRef();

        this.checkDisclaimer();
    }

    // checks if the disclaimer hasn't been accpeted it prompts the user to accept it
    checkDisclaimer = () => {
        if (localStorage.getItem("disclaimer_seen") >= currentDisclaimerVersion) return;

        this.showAlert("Disclaimer", disclaimerText, { backdrop: true, allowOutsideClick: () => false }).then((e) => {
            if (e.isConfirmed) localStorage.setItem("disclaimer_seen", currentDisclaimerVersion);
        });

        return;
    };

    // called when the load schedule button is called
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

    // makes web request to get the schedule and then sets the state
    getSchedule = async (id) => {
        console.debug("getSchedule is called with", id);
        if (!/^\d{1,2}-\d{4,5}$/.test(id)) {
            this.showAlert("Error", "invalid id provided");
            analytics.logEvent("Load Scheudle", { type: "Error", result: "invalid id provided (internal)" });
            return;
        }

        let a;
        try {
            a = await axios.get(ApiUrl, { params: { id } });
        } catch (e) {
            console.error("exception in getScheudle", e.toString());
            this.showAlert("Error while making request", e.toString());
            analytics.logEvent("Load Scheudle", { type: "Error while making request", result: e.toString() });
            return;
        }

        if (a.data.status !== "ok") {
            this.showAlert(a.data.status, a.data.error);
            analytics.logEvent("Load Scheudle", { type: a.data.status, result: a.data.error });
            return;
        }

        if (a.data.error) {
            this.showAlert("Warning", a.data.error);
            analytics.logEvent("Load Scheudle", { type: "Warning", result: a.data.error });
        } else {
            analytics.logEvent("Load Scheudle", { type: "ok", result: "not error from request" });
        }

        this.setState({ sched: a.data.data });
    };

    // called each time the update field changes to update the state and load scheudle button color
    updateID = (a) => {
        let value = a.target.value;
        this.setState({ id: value });
        let button = this.getButton.current;
        if (/^\d{1,2}-\d{4,5}$/.test(value)) {
            button.setAttribute("ready", "");
        } else button.removeAttribute("ready");
    };

    // shows an alert using sweet alert 2
    // takes the title, message, additional sweet alert 2 parameters
    showAlert = (type, info = "", obj = {}) => {
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

    // triggers getScheudle when the enter key is pressed
    keyUpListener = (e) => {
        if (e.keyCode !== 13) return;
        this.onGetClick();
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
                <Schedule schedule={this.state.sched} />
                <ChangeTheme />
            </div>
        );
    }
}

export default App;
