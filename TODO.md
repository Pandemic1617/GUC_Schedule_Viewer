# TODO

### Client
- [x] improve change theme design
- [x] test css for diffrent browsers (normalization)
- [x] organise files into folders and remove unnecessary ones 
- [x] change alert button text color and background color
- [x] add constants file
- [x] seperate the theme change button into a new component
- [x] convert all variable names to camel case
- [x] add descriptive comments
- [x] add proper logging and remove old logging

### Server
- [x] properly store credentials in environment variables
- [x] change invalid id regex to match client
- [x] make sure logs are descriptive enough to fix edge cases in scraping
- [x] add proper logging and remove old logging
- [x] add descriptive comments
- [x] save commands to setup the local emulator's enviroment
- [x] reduce firestore reads by combining course loaded checks
- [x] save all tutorials of a course in the same document to save firestore writes


### Public Deployment
- [x] remove id from analytics logEvent
- [x] add logo
- [x] remove idk from table
- [ ] limit max number of concurrent instances of functions
- [ ] possibly disable api after group switching closes


### Strech
- [ ] add tests
- [ ] rewrite client and server in TS