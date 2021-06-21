const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

const prepareCourses = require('./prepareCourses.js');

exports.helloWorld = functions.region('europe-west1').https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebases!");
});

exports.prepare_courses = prepareCourses.prepare_courses;