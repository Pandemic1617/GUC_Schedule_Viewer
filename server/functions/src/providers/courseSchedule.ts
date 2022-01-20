import { logger } from "firebase-functions/v2";
import { JSDOM } from "jsdom";
import * as _ from "lodash";
import { academicScheduleUrl, courseDataMaxAge } from "../consts";
import { courseFirestore, getCoursesInfoFirestore } from "../firestore";
import { doPostRequest } from "../requests";
import { Parsed, RequestValidation, Stored } from "../types";
import { currentTime } from "../utils";
import DataLoader = require("dataloader");

const courseScheduleRequestDetails = _.memoize(async () =>
    getCoursesInfoFirestore()
        .get()
        .then((doc) => doc.data()?.request_details as RequestValidation)
);

// extract the raw HTML to return the course schedule
const extractCourseSchedule = (data: string) => {
    const doc = new JSDOM(data).window.document;
    const children = doc.querySelector("#schedule")?.firstElementChild?.children;
    if (!children) throw new Error("no children found");
    const ret = Array.from(children)
        .slice(1)
        .map((row) => {
            const day = row.children[0].textContent?.trim();
            const ret = Array.from(row.children)
                .slice(1)
                .map((cell) => {
                    return Array.from(cell.children).map((s) => {
                        const session = s.firstElementChild;
                        if (!session) throw new Error("no session found");
                        return {
                            group: session.children[1].textContent,
                            location: session.children[3].textContent,
                            staff: session.children[5].textContent,
                        };
                    });
                });
            return { ret, day };
        });
    return ret;
};

const parseCourseSchedules = (schedules: ReturnType<typeof extractCourseSchedule>) => {
    const ret: Parsed.Schedule = {};
    for (let i = 0; i < schedules.length; i += 1) {
        for (let j = 0; j < schedules[i].ret.length; j += 1) {
            const cell = schedules[i].ret[j];
            for (const session of cell) {
                const group = session.group;
                if (!group) continue;

                if (!ret[group]) ret[group] = [];

                ret[group].push({
                    x: i,
                    y: j,
                    location: session.location ?? "",
                    staff: { name: session.staff ?? undefined },
                });
            }
        }
    }
    return ret;
};

// gets the course schedule from the guc website and saves it to the store
const downloadCourseSchedule = async (course: Stored.Course) => {
    const { view_state: viewState, event_validation: eventValidation } = await courseScheduleRequestDetails();

    const formData = {
        __VIEWSTATE: viewState,
        __EVENTVALIDATION: eventValidation,
        "course[]": course.id,
    };
    const rawCourseSchedules = await doPostRequest({
        url: academicScheduleUrl,
        formData,
    });
    const a = extractCourseSchedule(rawCourseSchedules);
    console.log(`starting extraction2 of course_schedule with ${a.length}`);
    const courseSchedules = parseCourseSchedules(a);

    logger.info(`downloaded course_schedule ${JSON.stringify({ course, courseSchedules })}`);
    return courseSchedules;
};

// returns the course schedule from either the store or calling downloadCourseSchedule
const getCourseSchedule = async ({ courseCode }: { courseCode: string }) => {
    if (!courseCode) throw "invalid course_code";

    const docRef = courseFirestore(courseCode);

    const doc = await docRef.get();
    const course = doc.data() as Stored.Course | undefined;
    if (!doc.exists || !course) throw "course does not exist";

    const updateTime = doc.updateTime?.toMillis() ?? 0;

    const time = currentTime();
    const isExpired = updateTime + courseDataMaxAge < time;
    const isLoaded = course.loaded;
    if (!isExpired && isLoaded) return course;

    const newCourseSchedule = await downloadCourseSchedule(course);

    const newDocData = {
        loaded: true,
        sched: newCourseSchedule,
        lastUpdateTime: time,
    };

    await docRef.set(newDocData, { merge: true });

    return { ...course, ...newDocData };
};

export const courseScheduleDataLoader = new DataLoader(
    async (courseCodes: readonly string[]) => {
        const courseSchedules = await Promise.allSettled(
            courseCodes.map((courseCode) => getCourseSchedule({ courseCode }))
        );
        return courseSchedules;
    },
    { cache: false }
);
