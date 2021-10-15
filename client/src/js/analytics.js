import firebase from "firebase/app";
import "firebase/analytics";
import { firebaseConfig } from "./secret";

const app = firebase.initializeApp(firebaseConfig);
const analytics = app.analytics();

export { analytics };
