import "./Home.css";
import React from "react";

import Schedule from "../visual/Schedule";

import { idRegex } from "../../js/consts";
import { showAlert, checkDisclaimer, downloadSchedule } from "../../js/utils.js";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sched: [],
            id: "",
        };
        this.getButton = React.createRef();
        this.idInput = React.createRef();

        checkDisclaimer();
    }

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
        try {
            const { scheduleData, warning } = await downloadSchedule(id);
            if (showAlert.title) showAlert(warning.title, warning.description);
            this.setState({ sched: scheduleData });
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
            </div>
        );
    }
}

export default Home;
