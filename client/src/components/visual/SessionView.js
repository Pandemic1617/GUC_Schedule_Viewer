import "./SessionView.css";
import React from "react";
import { showAlert, escapeHTML, camelToSpace } from "../../js/utils.js";

class SessionView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { data: props.data };
    }

    handleClick = () => {
        const rawData = this.state.data;
        const parsedData = [
            ["Course Code", rawData.courseCode],
            ["Course Name", rawData.courseName],
            ["Type", rawData.type],
            ["Session Group", rawData.tutorialGroup],
            ["Location", rawData.location],
            ["Staff", rawData.staff.join(", ")],
        ]
            .map(([key, value]) => `<div class="SessionPopupKey"> ${escapeHTML(key)}: </div><div class="SessionPopupValue"> ${escapeHTML(value)} </div>`) // escapeHTML on key not currently needed but should be kept to handle future changes
            .join("\n");

        showAlert(rawData.courseCode, parsedData, { showConfirmButton: false, dontEscape: true });
    };

    render() {
        return (
            <div className="SessionView">
                <div className={["sessioncontainer", this.state.data.type].join(" ")}>
                    <div id="location">{this.state.data.location}</div>
                    <div id="course" onClick={this.handleClick}>{this.state.data.courseCode}</div>
                    <div id="group">{this.state.data.tutorialGroup}</div>
                    <div id="staff">{this.state.data.staff.join(", ")}</div>
                </div>
            </div>
        );
    }
}
export default SessionView;
