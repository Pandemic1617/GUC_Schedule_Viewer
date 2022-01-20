import { courseCategories, ENG, LAW } from "./consts";
import { courseScheduleDataLoader } from "./providers/courseSchedule";
import { groupsScheduleDataLoader } from "./providers/groupsSchedule";
import { getStudentDataReport } from "./providers/studentDataReport";
import { Parsed } from "./types";
import functions = require("firebase-functions");
import _ = require("lodash");

const predictedEmails: { [a: string]: string } = {};

const combineSessions = (input: Parsed.Sessions[]) => {
    const collection = _.groupBy(input, (v) => JSON.stringify([v.x, v.y, v.location]));

    const ret = Object.entries(collection).map(([key, value]) => {
        return {
            x: value[0].x,
            y: value[0].y,
            location: value[0].location,
            staff: value
                .flatMap((v) => (v.staff ? [v.staff] : []))
                .flatMap((staff) => [
                    {
                        name: staff.name,
                        email: staff.name && predictedEmails[staff.name],
                    },
                ]),
        };
    });

    return ret;
};

const courseNamesToSchedCategory = (courseNames: string[]) => {
    const categories = courseNames
        .map((v) => v.split(" ")[0])
        .filter((v) => v)
        .map((v) => courseCategories[v])
        .filter((v) => v);
    const engCount = categories.filter((v) => v == ENG).length;
    const lawCount = categories.filter((v) => v == LAW).length;

    if (engCount && lawCount)
        functions.logger.warn("courseNamesToSlotCategories detected both eng and law", {
            courseNames,
            categories,
            engCount,
            lawCount,
        });

    if (engCount == 0 && lawCount == 0) return "";

    if (engCount > lawCount) return ENG;

    return LAW;
};

// get_student_schedule called with get request or an option preflight request and returns the student schedule for the provided id
export const getStudentSchedule = async (id: string) => {
    const studentData = await getStudentDataReport(id);

    const err: string[] = [];
    const result: {
        course_code: string;
        tut_group: string;
        type: string;
        sessions: { x: any; y: any; location: any; staff: any }[];
        course_name: any;
    }[] = [];

    await Promise.all(
        studentData.map(async (courseSession) => {
            const courseInfo = await courseScheduleDataLoader.load(courseSession.courseCode);
            const groupInfo = await groupsScheduleDataLoader.load(courseSession.courseGroupName);
            const availableScheds = [];
            if (courseInfo.status === "fulfilled") availableScheds.push(courseInfo.value);
            if (groupInfo.status === "fulfilled") availableScheds.push(groupInfo.value);
            const data = combineSessions(
                availableScheds
                    .map((info) => info.sched![courseSession.expectedGroup])
                    .flat()
                    .filter((v) => v)
            );

            const courseName =
                courseInfo.status === "fulfilled" ? courseInfo.value.course_name : courseSession.courseCode;

            if (data.length)
                result.push({
                    course_code: courseSession.courseCode,
                    tut_group: courseSession.tutorialGroup,
                    type: courseSession.typeName,
                    sessions: data,
                    course_name: courseName,
                });
            else
                err.push(
                    courseSession.courseCode +
                        `;${courseSession.courseGroupName}` +
                        `: group ${courseSession.expectedGroup} not found`
                );
        })
    );

    const schedCategory = courseNamesToSchedCategory(result.map((v) => v.course_name));

    const ret = {
        status: "ok",
        error: err.join("\n"),
        data: { slots: result, schedCategory },
    };
    return ret;
};
