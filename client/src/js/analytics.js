import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent as rawLogEvent } from "firebase/analytics";
import { firebaseConfig } from "./secret";
import { appVersion } from "./consts";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const logEvent = (eventName, eventParams) => rawLogEvent(analytics, eventName, { appVersion, connection: "online", ...eventParams });

export { logEvent };
