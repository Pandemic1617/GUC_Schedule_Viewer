import "./Home.css";
import React from "react";

import Schedule from "../visual/Schedule";

import { idRegex } from "../../js/consts";
import { showAlert, checkDisclaimer, downloadSchedule } from "../../js/utils.js";
import { logEvent } from "../../js/analytics";
import { saveSchedule } from "../../js/storedSchedule";
import FloatingButton from "./FloatingButton";

const sched = {
    schedCategory: "",
    slots: [],
};

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sched,
            lastGucId: "",
        };
        this.getButton = React.createRef();
        this.idInput = React.createRef();

        checkDisclaimer();
        logEvent("page_view", { page: "home" });
    }

    // called when the load schedule button is called
    onGetClick = async () => {
        let id = this.updateID();
        let a = this.getButton.current;
        if (a.disabled === true) return;
        this.setState({ sched });
        a.disabled = true;
        this.getSchedule(id).then((e) => {
            a.disabled = false;
        });
    };

    // makes web request to get the schedule and then sets the state
    getSchedule = async (id) => {
        try {
            const { scheduleData, warning } = await downloadSchedule(id);
            if (showAlert.title) showAlert(warning.title, warning.description);
            this.setState({ sched: scheduleData, lastGucId: id });
        } catch (error) {
            showAlert("Error", error.message);
        }
    };

    // called each time the update field changes to update the state and load scheudle button color
    updateID = () => {
        let value = this.idInput.current.value;
        this.setState({ id: value });
        let button = this.getButton.current;
        if (idRegex.test(value)) button.setAttribute("ready", "");
        else button.removeAttribute("ready");
        return value;
    };

    // triggers getScheudle when the enter key is pressed
    keyUpListener = (e) => {
        if (e.keyCode !== 13) return;
        this.onGetClick();
    };

    onSaveSchedule = () => {
        const message = this.state.lastGucId.length > 0 ? `Are you sure you want to save ${this.state.lastGucId}'s schedule?` : "Are you sure you want to clear the saved schedule?";
        showAlert("Save Schedule", message, { showCancelButton: true, confirmButtonStyledText: "Yes", cancelButtonStyledText: "No" }).then((result) => {
            if (!result.isConfirmed) return;
            saveSchedule(this.state.sched);
            logEvent("saved_schedule");
            window.location.href = "/my_schedule";
        });
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
                <FloatingButton onClick={this.onSaveSchedule} text="Save My Schedule" />
            </div>
        );
    }
}

export default Home;
