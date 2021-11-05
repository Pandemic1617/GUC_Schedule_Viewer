import { initializeApp } from "firebase/app";
import { logEvent as rawLogEvent, initializeAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./secret";
import { appVersion } from "./consts";

const app = initializeApp(firebaseConfig);
const analytics = initializeAnalytics(app, { config: { connection: "online", appVersion } });
const logEvent = (eventName, eventParams) => rawLogEvent(analytics, eventName, { ...eventParams });

export { logEvent };
