// import logo from './logo.svg';
import "./Schedule.css";
import React from "react";
import CellView from "../visual/CellView";

class Schedule extends React.Component {
    constructor(props) {
        console.debug("Schedule constructor called");
        super(props);
        this.state = { org_schedule: props.schedule };
    }
    shouldComponentUpdate(nextProps) {
        return nextProps.schedule !== this.state.org_schedule;
    }

    days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    parseScheudle(inSched) {
        let out = new Array(7).fill(0).map((e) => {
            return new Array(5).fill(0).map((e) => []);
        });

        for (let course of inSched) {
            for (let session of course.sessions) {
                let ret = {};

                ret.course_code = course.course_code;
                ret.type = course.type;
                ret.tut_group = course.tut_group;
                ret.location = session.location;
                ret.staff = session.staff;

                out[session.x][session.y].push(ret); // maybe y >=5 ie. something after the 5th session
            }
        }

        let cnt = Array(7).fill(0);
        for (let i = 0; i < out.length; i++) for (let blah of out[i]) cnt[i] += blah.length;

        if (cnt[6] === 0) out.pop();
        console.debug("parseSchedule", out);
        return out;
    }

    render() {
        let sched = this.parseScheudle(this.state.org_schedule);

        return (
            <div className="SchedView">
                <table id="sched">
                    <tbody>
                        <tr>
                            <th>idk</th>
                            <th>1st</th>
                            <th>2nd</th>
                            <th>3rd</th>
                            <th>4th</th>
                            <th>5th</th>
                        </tr>
                        {sched.map((e, i) => {
                            return (
                                <tr key={this.days[i]}>
                                    <th>{this.days[i]}</th>
                                    {e.map((v, i) => {
                                        return (
                                            <th key={i}>
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
