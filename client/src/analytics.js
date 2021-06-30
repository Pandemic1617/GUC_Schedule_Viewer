import firebase from "firebase";

var firebaseConfig = {
    apiKey: "AIzaSyD3-hPEKEf99rGyBy84z7GR-pGrErluJpU",
    authDomain: "gucschedule.firebaseapp.com",
    projectId: "gucschedule",
    storageBucket: "gucschedule.appspot.com",
    messagingSenderId: "621973797621",
    appId: "1:621973797621:web:56ac02c13ae4653521a3bc",
    measurementId: "G-LB7NRX352B",
};

const analytics = firebase.initializeApp(firebaseConfig).analytics();

export { analytics };
