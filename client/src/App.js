import "./App.css";
import React from "react";
import axios from "axios";

import Schedule from "./Schedule";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const current_disclaimer_version = 1;
const API_URL = "https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule";

const disclaimer_text =
    "This app comes with absolutely no warranties or guarantees. You are solely responsible for the use of this app and should only use it on people who have given you permission. This app merely uses information available to any GUC student through the admin system. This is an app made by a GUC student and is in no way endorsed by the GUC.";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sched: [],
            id: "",
        };

        this.checkDisclaimer();
    }

    checkDisclaimer = () => {
        if (localStorage.getItem("disclaimer_seen") >= current_disclaimer_version) return;

        MySwal.fire({
            title: "Disclaimer",
            text: disclaimer_text,
            backdrop: true,
            allowOutsideClick: () => false,
        }).then((e) => {
            if (e.isConfirmed) localStorage.setItem("disclaimer_seen", current_disclaimer_version);
        });

        return;
    };

    onGetClick = async () => {
        let a = document.querySelector("#get");
        if (a.disabled === true) return;
        this.setState({ sched: [] });
        a.disabled = true;
        this.getSchedule().then((e) => {
            a.disabled = false;
        });
    };

    getSchedule = async () => {
        if (!/\d{1,2}-\d{4,5}/.test(this.state.id)) {
            this.onShowAlert("Error", "invalid id provided");
            return;
        }

        let a;
        try {
            a = await axios.get(API_URL, { params: { id: this.state.id } });
        } catch (e) {
            this.onShowAlert("Error while making request", e.toString());

            return;
        }

        if (a.data.status !== "ok") {
            this.onShowAlert(a.data.status, a.data.error);

            return;
        }

        if (a.data.error) {
            this.onShowAlert("Warning", a.data.error);
        }

        this.setState({ sched: a.data.data });
    };

    updateID = (a) => {
        this.setState({ id: a.target.value });
    };

    onShowAlert = (type, info = "") => {
        MySwal.fire(type, info);
    };

    render() {
        return (
            <div className="App">
                <div id="name"> GUC Schedule Viewer</div>
                <input id="id" type="text" placeholder="Enter GUC ID" onChange={this.updateID}></input>
                <br></br>
                <button id="get" onClick={this.onGetClick}>
                    {" "}
                    Load Schedule
                </button>
                <Schedule schedule={this.state.sched} key={this.state.sched} />
            </div>
        );
    }
}

export default App;
