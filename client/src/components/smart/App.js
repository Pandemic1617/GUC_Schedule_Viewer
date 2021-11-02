import React from "react";
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import { slide as Menu } from "react-burger-menu";
import "./App(menu).css";
import { initTheme, switchTheme } from "../../js/theme";
import MySchedule from "./MySchedule";
import Home from "./Home";

initTheme();

const menuStyles = {
    bmItemList: {
        height: "auto",
    },
};

const App = () => {
    return (
        <Router>
            <div>
                <Menu styles={menuStyles}>
                    <NavLink exact={true} activeClassName="link-active" to="/">
                        <div className="menu-item" id="home-link">
                            Home
                        </div>
                    </NavLink>
                    <NavLink activeClassName="link-active" to="/my_schedule">
                        <div className="menu-item" id="myScheudle-link">
                            My Schedule
                        </div>
                    </NavLink>
                    <div className="menu-item" id="changeTheme-button" onClick={switchTheme}>
                        Change Theme
                    </div>
                </Menu>

                <Switch>
                    <Route path="/my_schedule">
                        <MySchedule />
                    </Route>
                    <Route path="/">
                        <Home />
                    </Route>
                </Switch>
            </div>
        </Router>
    );
};

export default App;
