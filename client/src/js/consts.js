const currentDisclaimerVersion = 2;

const ApiUrl = "https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule";

const disclaimerText =
    "This service comes with absolutely no warranties or guarantees. You are solely responsible for the use of this service and should only use it on people who have given you permission. This service merely uses information available to any GUC student through the admin system. This is a website made by a GUC student and is in no way endorsed by the GUC. This website uses google analytics.";

const themes = ["theme-dark", "theme-light"];

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export { currentDisclaimerVersion, ApiUrl, disclaimerText, themes, days };
