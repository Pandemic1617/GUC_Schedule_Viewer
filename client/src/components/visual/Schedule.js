import "./Schedule.css";
import React from "react";
import CellView from "./CellView";
import { days } from "../../js/consts.js";
import { parseScheudle } from "../../js/utils.js";

class Schedule extends React.Component {
    constructor(props) {
        console.debug("Schedule constructor called");
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            (nextProps.schedule.length || this.props.schedule.length) && // if both arrays are empty don't update
            nextProps.schedule !== this.props.schedule // if both arrays have the same refrence don't update
        );
    }

    render() {
        return (
            <div className="SchedView">
                <table id="sched">
                    <tbody>
                        <tr>
                            <th>Day/Session</th>
                            <th>1st</th>
                            <th>2nd</th>
                            <th>3rd</th>
                            <th>4th</th>
                            <th>5th</th>
                        </tr>
                        {parseScheudle(this.props.schedule).map((e, i) => {
                            return (
                                <tr key={e + i}>
                                    <th>{days[i]}</th>
                                    {e.map((v, j) => {
                                        return (
                                            <th key={v + j}>
                                                <CellView ini={v} />
                                            </th>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default Schedule;
