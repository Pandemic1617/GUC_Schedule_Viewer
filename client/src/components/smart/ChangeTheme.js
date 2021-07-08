import "./ChangeTheme.css";
import React from "react";
import { themes } from "../../js/consts.js";

class ChangeTheme extends React.Component {
    constructor(props) {
        super(props);
        this.initTheme();
    }

    initTheme = () => {
        let currentTheme = localStorage.getItem("theme_choice");
        if (currentTheme == null) currentTheme = 0;
        this.setTheme(currentTheme, false);
    };

    setTheme = (newTheme, save = true) => {
        if (save) localStorage.setItem("theme_choice", newTheme);
        document.documentElement.classList.add(themes[newTheme]);
        this.currentTheme = newTheme;
    };

    switchTheme = () => {
        document.documentElement.classList.remove(themes[this.currentTheme]);
        this.setTheme((this.currentTheme + 1) % themes.length);
    };

    onThemeChange = () => {
        this.switchTheme();
    };

    render() {
        return (
            <div className="ChangeTheme">
                <button id="theme_change" onClick={this.onThemeChange}>
                    Change Theme
                </button>
            </div>
        );
    }
}

export default ChangeTheme;
