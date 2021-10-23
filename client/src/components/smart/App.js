import "./App.css";
import React from "react";
import axios from "axios";

import Schedule from "../visual/Schedule";

import { directLogEvent } from "../../js/analytics.js";

import ChangeTheme from "./ChangeTheme.js";
import { currentDisclaimerVersion, ApiUrl, disclaimerText } from "../../js/consts.js";
import { showAlert } from "../../js/utils.js";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sched: [],
            id: "",
        };
        this.getButton = React.createRef();
        this.idInput = React.createRef();

        this.checkDisclaimer();
    }

    // checks if the disclaimer hasn't been accpeted it prompts the user to accept it
    checkDisclaimer = () => {
        if (localStorage.getItem("disclaimer_seen") >= currentDisclaimerVersion) return;

        showAlert("Disclaimer", disclaimerText, { backdrop: true, allowOutsideClick: () => false, dontEscape: true }).then((e) => {
            if (e.isConfirmed) localStorage.setItem("disclaimer_seen", currentDisclaimerVersion);
        });

        return;
    };

    // called when the load schedule button is called
    onGetClick = async () => {
        let id = this.updateID();
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
            showAlert("Error", "invalid id provided");
            directLogEvent("Load Scheudle", { type: "Error", result: "invalid id provided (internal)" });
            return;
        }

        let a;
        try {
            a = await axios.get(ApiUrl, { params: { id } });
        } catch (e) {
            console.error("exception in getScheudle", e.toString());
            showAlert("Error while making request", e.toString());
            directLogEvent("Load Scheudle", { type: "Error while making request", result: e.toString() });
            return;
        }

        if (a.data.status !== "ok") {
            showAlert(a.data.status, a.data.error);
            directLogEvent("Load Scheudle", { type: a.data.status, result: a.data.error });
            return;
        }

        if (a.data.error) {
            showAlert("Warning", a.data.error);
            directLogEvent("Load Scheudle", { type: "Warning", result: a.data.error });
        } else {
            directLogEvent("Load Scheudle", { type: "ok", result: "not error from request" });
        }

        this.setState({ sched: a.data.data });
    };

    // called each time the update field changes to update the state and load scheudle button color
    updateID = () => {
        let value = this.idInput.current.value;
        this.setState({ id: value });
        let button = this.getButton.current;
        if (/^\d{1,2}-\d{4,5}$/.test(value)) {
            button.setAttribute("ready", "");
        } else button.removeAttribute("ready");
        return value;
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
                <input id="id" type="text" placeholder="Enter GUC ID" onChange={this.updateID} onKeyUp={this.keyUpListener} ref={this.idInput}></input>
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
