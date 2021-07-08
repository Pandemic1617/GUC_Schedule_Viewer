import "./SessionView.css";
import React from "react";

class SessionView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { data: props.data };
    }

    render() {
        return (
            <div className="SessionView">
                <div className={["sessioncontainer", this.state.data.type].join(" ")}>
                    <div id="location">{this.state.data.location}</div>
                    <div id="course">{this.state.data.courseCode}</div>
                    <div id="group">{this.state.data.tutorialGroup}</div>
                    <div id="staff">{this.state.data.staff}</div>
                </div>
            </div>
        );
    }
}
export default SessionView;
