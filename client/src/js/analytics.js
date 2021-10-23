import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { firebaseConfig } from "./secret";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const directLogEvent = (...inp) => logEvent(analytics, ...inp);

export { directLogEvent };
