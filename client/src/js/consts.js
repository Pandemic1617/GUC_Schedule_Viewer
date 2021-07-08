const current_disclaimer_version = 1;

const API_URL = "https://europe-west1-gucschedule.cloudfunctions.net/get_student_schedule";

const disclaimer_text =
    "This app comes with absolutely no warranties or guarantees. You are solely responsible for the use of this app and should only use it on people who have given you permission. This app merely uses information available to any GUC student through the admin system. This is an app made by a GUC student and is in no way endorsed by the GUC.";

const themes = ["theme-dark", "theme-light"];

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export { current_disclaimer_version, API_URL, disclaimer_text, themes, days };
