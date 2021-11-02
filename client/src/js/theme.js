import { themes } from "./consts";

let currentTheme;

const initTheme = () => {
    let currentTheme = localStorage.getItem("theme_choice");
    if (currentTheme == null) currentTheme = 0;
    setTheme(currentTheme, false);
};

// sets the current theme and saves it in
const setTheme = (newTheme, save = true) => {
    if (currentTheme) document.documentElement.classList.remove(themes[currentTheme]);
    if (save) localStorage.setItem("theme_choice", newTheme);
    document.documentElement.classList.add(themes[newTheme]);
    currentTheme = newTheme;
};

// switches the current theme to the next one in themes
const switchTheme = () => {
    setTheme((currentTheme + 1) % themes.length);
};

export { initTheme, switchTheme };
