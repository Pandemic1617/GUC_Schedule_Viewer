import "./SessionView.css";
import React from "react";
import { showAlert, escapeHTML, camelToSpace } from "../../js/utils.js";

class SessionView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { data: props.data };
    }

    handleClick = () => {
        let data = this.state.data;
        let info = Object.entries(data).map(([key, value]) => `<div class="SessionPopupKey"> ${escapeHTML(camelToSpace(key))}: </div><div class="SessionPopupValue"> ${escapeHTML(value)} </div>`);

        showAlert(data.courseCode, info.join("\n"), { showConfirmButton: false, dontEscape: true });
    };

    render() {
        return (
            <div className="SessionView">
                <div className={["sessioncontainer", this.state.data.type].join(" ")}>
                    <div id="location">{this.state.data.location}</div>
                    <div id="course" onClick={this.handleClick}>{this.state.data.courseCode}</div>
                    <div id="group">{this.state.data.tutorialGroup}</div>
                    <div id="staff">{this.state.data.staff.join(', ')}</div>
                </div>
            </div>
        );
    }
}
export default SessionView;
