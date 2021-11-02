import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent as rawLogEvent } from "firebase/analytics";
import { firebaseConfig } from "./secret";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const logEvent = (...inp) => rawLogEvent(analytics, ...inp);

export { logEvent };
