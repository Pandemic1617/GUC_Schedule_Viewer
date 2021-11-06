import { initializeApp } from "firebase/app";
import { logEvent as rawLogEvent, initializeAnalytics, setUserProperties } from "firebase/analytics";
import { firebaseConfig } from "./secret";
import { appVersion } from "./consts";

const app = initializeApp(firebaseConfig);
const analytics = initializeAnalytics(app, { config: { connection: "online", appVersion } });
setUserProperties(analytics, { appVersion });
const logEvent = (eventName, eventParams) => rawLogEvent(analytics, eventName, { ...eventParams });

export { logEvent };
