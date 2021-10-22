const maxDataReportRetries = 2;
const maxCourseScheduleRetries = 2;
const courseDataMaxAge = 1000 * 60 * 60 * 6; // in millis
const groupScheduleMaxAge = 1000 * 60 * 60 * 6; // in millis

const runtimeOptsGetStudentSchedule = {
    timeoutSeconds: 60,
    memory: "256MB",
    maxInstances: 30,
};

const runtimeOptsPerpareCourses = {
    timeoutSeconds: 540,
    memory: "1GB",
    maxInstances: 1,
};
export { maxDataReportRetries, runtimeOptsGetStudentSchedule, maxCourseScheduleRetries, courseDataMaxAge, runtimeOptsPerpareCourses, groupScheduleMaxAge };
