import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { initTheme,switchTheme } from "../../js/theme";
import Home from "./Home";

initTheme();

const App = () => {
    return (
        <Router>
            <div>
                {/* <nav>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/users">Users</Link>
                        </li>
                        <li>
                            <div onClick={switchTheme}>switch theme</div>
                        </li>
                    </ul>
                </nav> */}

                {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
                <Switch>
                    {/* <Route path="/about">
                        <About />
                    </Route>
                    <Route path="/users">
                        <Users />
                    </Route> */}
                    <Route path="/">
                        <Home />
                    </Route>
                </Switch>
            </div>
        </Router>
    );
};

export default App;
