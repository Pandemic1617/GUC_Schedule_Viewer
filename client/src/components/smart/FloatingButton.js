import "./FloatingButton.css";
import React from "react";

class FloatingButton extends React.Component {
    constructor(props) {
        super(props);
        if (this.props.onInit) this.props.onInit();
    }

    render() {
        return (
            <div className="FloatingButtonContainer">
                <button className="FloatingButton" onClick={this.props.onClick}>
                    {this.props.text}
                </button>
            </div>
        );
    }
}

export default FloatingButton;
