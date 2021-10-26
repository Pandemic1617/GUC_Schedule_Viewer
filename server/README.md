# Server

The server is designed to be deployed to [Google Cloud Platform](https://cloud.google.com/) and to run on [Google Cloud Functions](https://cloud.google.com/functions). It also uses [Google Cloud Firestore](https://cloud.google.com/firestore) to cache course schedules.
The server is implemented in JavaScript except for the utils and constants which are in TypeScript. The server has a get method called "get_student_data" which when called with the student's id returns the student schedule for the provided id.

## Setup

1. after opening a terminal in the server folder, run `npm i` to install the required dependencies
2. run `firebase functions:config:set credentials.username="USERNAME" credentials.password="PASSWORD"` and replace `USERNAME` and `PASSWORD` with you GUC username and password
3. run `npm run setup-env` to save the environment variables in `.runtimeconfig.json`. This is required for the local development server to have access to the credentials
4. create the `secret.js` file that contains the `prepare_courses` key
5. run `npm run serve` to run the development server on localhost
6. call `prepare_courses` with your key
7. now you have an api exposes on `http://localhost:5001/gucschedule/europe-west1/get_student_schedule` (by default) :)


### What happens when get_student_data is called

1. The student's enrolled courses are fetched from the student data report.
2. For each course the student is enrolled in, the server gets the course schedule from the cache, if it is available. If the schedule is not in the cache, then the server fetches the schedule, saves the schedule in cache and returns the data.
3. The course schedules are filtered for the tutorials that the student attends and then the student schedule is returned.
