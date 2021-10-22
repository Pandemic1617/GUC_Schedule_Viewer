import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./secret";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { analytics };
