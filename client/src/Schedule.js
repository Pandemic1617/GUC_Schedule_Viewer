// import logo from './logo.svg';
import "./Schedule.css";
import React from "react";
import CellView from "./CellView";

class Schedule extends React.Component {
    constructor(props) {
        console.debug("in schedule constructor");
        super(props);
        this.state = { sched: this.parseScheudle(props.schedule), org_schedule: props.schedule };
    }
    shouldComponentUpdate(nextProps) {
        console.debug("shoudl update called");
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

        console.debug(out);
        let cnt = Array(7).fill(0);
        for (let i = 0; i < out.length; i++) for (let blah of out[i]) cnt[i] += blah.length;

        if (cnt[6] === 0) out.pop();
        console.debug(cnt);
        console.debug(out);
        return out;
    }

    render() {
        return (
            <div className="SchedView">
                <table id="sched">
                    <tr>
                        <th> idk</th> <th>1st</th> <th>2nd</th> <th> 3rd</th> <th>4th</th> <th>5th</th>
                    </tr>
                    {this.state.sched.map((e, i) => {
                        return (
                            <tr>
                                <th>{this.days[i]}</th>
                                {e.map((v) => {
                                    return (
                                        <th>
                                            <CellView ini={v} />
                                        </th>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </table>
            </div>
        );
    }
}

export default Schedule;
