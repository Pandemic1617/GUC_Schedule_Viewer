# Server

The server is designed to be deployed to Google Cloud Functions (Firebase Functions). It also uses Google Cloud Firestore to cache course schedules.
The server is implemented in JS except for lazyVariable which is in TS. The server has a get method called "get_student_data" which when called with the student's id returns the student schedule for the provided id.

## Setup

### Set the username and password environment variables

```
firebase functions:config:set credentials.username="USERNAME" credentials.password="PASSWORD"
```

don't forget to run the setup-env npm script before running the local emulator

prepare_courses should be run once before any call to get_student_data is made

## What happens when get_student_data is called

1. the student's enrolled courses are fetched from the student data report.
2. for each course the student is enrolled in, the server gets the course schedule from the cache, if it is available. If the schedule is not in the cache, then the server fetches the schedule, saves the schedule in cache and returns the data.
3. the course schedules are filtered for the tutorials that the student attends and then the student scheudle is returned.
