import { initializeApp } from "firebase/app";
import { logEvent as rawLogEvent, initializeAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./secret";
import { appVersion } from "./consts";

const app = initializeApp(firebaseConfig);
const analytics = initializeAnalytics(app, { config: { connection: "online" } });
const logEvent = (eventName, eventParams) => rawLogEvent(analytics, eventName, { appVersion, ...eventParams });

export { logEvent };
