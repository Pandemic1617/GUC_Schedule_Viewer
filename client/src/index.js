import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./normalize.css";
import App from "./components/smart/App";

import "./js/analytics";
import { installer as swInstaller } from "./js/sw-manager";

swInstaller();

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById("root")
);
