import React from "react";
import "./MySchedule.css";
import Schedule from "../visual/Schedule";
import { retrieveSchedule } from "../../js/storedSchedule";

const MySchedule = () => {
    const sched = retrieveSchedule();

    return (
        <div className="MySchedule">
            <div id="title"> My Schedule </div>
            {sched.length > 0 ? (
                <Schedule schedule={sched} />
            ) : (
                <div id="noSchedule">
                    No Schedule is saved <br /> To save a schedule navigate to <a href="/">Home</a>, load the Schedule and click "Save My Schedule" on the top right
                </div>
            )}
        </div>
    );
};

export default MySchedule;
