import "./Schedule.css";
import React from "react";
import CellView from "./CellView";
import { days, ordinals, slotTimes } from "../../js/consts.js";
import { parseScheudle } from "../../js/utils.js";

class Schedule extends React.Component {
    constructor(props) {
        console.debug("Schedule constructor called");
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            (nextProps.schedule.slots.length || this.props.schedule.slots.length) && // if both arrays are empty don't update
            nextProps.schedule !== this.props.schedule // if both arrays have the same refrence don't update
        );
    }

    render() {
        const { schedCategory, slots } = this.props.schedule; // '' or 'eng', 'law'
        const chosenSlotTimes = slotTimes[schedCategory] ?? [];
        return (
            <div className="SchedView">
                <table id="sched">
                    <tbody>
                        <tr>
                            <th>Day/Session</th>
                            {new Array(5).fill(0).map((e, i) => {
                                return (
                                    <th>
                                        <div>{ordinals[i]}</div>
                                        <div>{chosenSlotTimes[i]}</div>
                                    </th>
                                );
                            })}
                        </tr>
                        {parseScheudle(slots).map((e, i) => {
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
