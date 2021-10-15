# GUC Schedule Viewer

A website that displays the schedule of a student at the GUC

You can check out the live version [here](https://gucschedule.web.app)

## About

This project is divided into two parts: Server, Client

### [Server](server/README.md) 

The server exposes an api that given the student's id returns the schedule.

The server is implemented in JS and TS and is designed to be deployed to [Google Cloud Platform](https://cloud.google.com/). It uses two main services: Google Cloud Functions and Google Cloud Firestore. 

### [Client](client/README.md)

The client is implemented in [ReactJS](https://reactjs.org/) and is currently hosted on Google Firebase Hosting. Although, it can be hosted as a static page on any hosting service.

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC)