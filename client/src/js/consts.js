const currentDisclaimerVersion = 3;

const ApiUrl = "https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule";

const disclaimerText =
    'This service comes with absolutely no warranties or guarantees. You are solely responsible for the use of this service and should only use it on people who have given you permission. This service merely uses information available to any GUC student through the admin system. This is a website made by a GUC student and is in no way endorsed by the GUC. This website uses google analytics. <a href="https://github.com/Pandemic1617/GUC_Schedule_Viewer" style="color:inherit">Source Code</a>';

const themes = ["theme-dark", "theme-light"];

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const ordinals = ["1st", "2nd", "3rd", "4th", "5th"];

const slotTimes = {
    eng: ["8:15 - 9:45", "10:00 - 11:30", "11:45 - 13:15", "13:45 - 15:15", "15:45 - 17:15"],
    law: ["8:15 - 9:45", "10:00 - 11:30", "12:00 - 13:30", "13:45 - 15:15", "15:45 - 17:15"],
};

const idRegex = /^\d{1,2}-\d{4,5}$/;

const appVersion = "0.1.2";

export { currentDisclaimerVersion, ApiUrl, disclaimerText, themes, days, idRegex, appVersion, ordinals, slotTimes };
