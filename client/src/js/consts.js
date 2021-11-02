const currentDisclaimerVersion = 3;

const ApiUrl = "https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule";

const disclaimerText =
    'This service comes with absolutely no warranties or guarantees. You are solely responsible for the use of this service and should only use it on people who have given you permission. This service merely uses information available to any GUC student through the admin system. This is a website made by a GUC student and is in no way endorsed by the GUC. This website uses google analytics. <a href="https://github.com/Pandemic1617/GUC_Schedule_Viewer" style="color:inherit">Source Code</a>';

const themes = ["theme-dark", "theme-light"];

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const idRegex = /^\d{1,2}-\d{4,5}$/;

export { currentDisclaimerVersion, ApiUrl, disclaimerText, themes, days,idRegex };
