import React from "react";
import "./MySchedule.css";
import Schedule from "../visual/Schedule";
import { retrieveSchedule } from "../../js/storedSchedule";
import { listenToInstall, promptInstall } from "../../js/sw-manager";
import FloatingButton from "./FloatingButton";
import { logEvent } from "../../js/analytics";
import { showAlert } from "../../js/utils";

class MySchedule extends React.Component {
    constructor(props) {
        super(props);
        const installAvailable = listenToInstall(() => this.setState({ installAvailable: true }));
        this.state = {
            installAvailable,
        };
        logEvent("page_view", { page: "my_schedule" });
    }

    handleInstallClick = async () => {
        this.setState({ installAvailable: false });
        let result = await promptInstall();
        console.log(result);
        if (result !== "accepted" && result.outcome !== "accepted") return;
        showAlert("GUC Schedule has been added to your homescreen", "Now you can access your saved schedule from your homescreen, even when offline :)");
        logEvent("A2HS");
    };

    render = () => {
        const sched = retrieveSchedule();
        return (
            <div className="MySchedule">
                <div id="title"> My Schedule </div>
                {sched.slots.length > 0 ? (
                    <Schedule schedule={sched} />
                ) : (
                    <div id="noSchedule">
                        No Schedule is saved <br /> To save a schedule navigate to <a href="/">Home</a>, load the Schedule and click "Save My Schedule" on the top right
                    </div>
                )}
                {this.state.installAvailable ? <FloatingButton text="Add to Home Screen" onClick={this.handleInstallClick} /> : ""}
            </div>
        );
    };
}

export default MySchedule;
