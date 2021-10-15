const maxDataReportRetries = 2;
const maxCourseScheduleRetries = 2;
const courseDataMaxAge = 1000 * 60 * 60 * 6; // in millis

const runtimeOptsGetStudentSchedule = {
    timeoutSeconds: 120,
    memory: "1GB",
};

export { maxDataReportRetries, runtimeOptsGetStudentSchedule, maxCourseScheduleRetries, courseDataMaxAge };
