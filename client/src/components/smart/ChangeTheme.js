import "./ChangeTheme.css";
import React from "react";
import { themes } from "../../js/consts.js";

class ChangeTheme extends React.Component {
    constructor(props) {
        super(props);
        this.initTheme();
    }

    // checks the saved theme_choice and loads it. if none then themes[0]
    initTheme = () => {
        let currentTheme = localStorage.getItem("theme_choice");
        if (currentTheme == null) currentTheme = 0;
        this.setTheme(currentTheme, false);
    };

    // sets the current theme and saves it in
    setTheme = (newTheme, save = true) => {
        if (this.currentTheme) document.documentElement.classList.remove(themes[this.currentTheme]);
        if (save) localStorage.setItem("theme_choice", newTheme);
        document.documentElement.classList.add(themes[newTheme]);
        this.currentTheme = newTheme;
    };

    // switches the current theme to the next one in themes
    switchTheme = () => {
        this.setTheme((this.currentTheme + 1) % themes.length);
    };

    // called when Change Theme is clicked
    onThemeChange = () => {
        this.switchTheme();
    };

    render() {
        return (
            <div className="ChangeTheme">
                <button id="themeChange" onClick={this.onThemeChange}>
                    Change Theme
                </button>
            </div>
        );
    }
}

export default ChangeTheme;
