import { logger } from "firebase-functions/v2";
import { JSDOM } from "jsdom";
import * as _ from "lodash";
import { generalGroupScheduleUrl, groupScheduleMaxAge } from "../consts";
import { getGroupsInfoFirestore, groupFirestore } from "../firestore";
import { doPostRequest } from "../requests";
import { Parsed, RequestValidation, Stored } from "../types";
import { currentTime } from "../utils";
import DataLoader = require("dataloader");

const groupScheduleRequestDetails = _.memoize(async () =>
    getGroupsInfoFirestore()
        .get()
        .then((doc) => doc.data()?.request_details as RequestValidation)
);

// extract the group schedule from the raw html data
const extractGroupSchedules = (data: string) => {
    const doc = new JSDOM(data).window.document;
    const children = doc.querySelector("#scdTbl")?.firstElementChild?.children;
    if (!children) throw new Error("no children found");
    const ret = Array.from(children)
        .slice(1)
        .map((row) => {
            if (row.children.length == 2) return [];
            return Array.from(row.children)
                .slice(1)
                .map((slot) => {
                    if (!slot.firstElementChild?.firstElementChild) return [];
                    return Array.from(slot.firstElementChild.firstElementChild.children).map((session) => {
                        const s = session.children;
                        const matchResult = s[2].textContent?.match(/^(\w*\s*\w*)\n\s*(\w*)\n\s*$/);
                        if (!matchResult) throw new Error("no match found");
                        const [course, courseCode, type] = matchResult;
                        const group = s[0].textContent;
                        if (!group) throw new Error("no group found");
                        const idx = group.lastIndexOf(" ");
                        const sessionGroup = group.slice(idx + 1);
                        let typeName = "";
                        if (sessionGroup[0] == "T") {
                            typeName = "Tutorial";
                        } else if (sessionGroup[0] == "L") {
                            typeName = "Lecture";
                        } else if (sessionGroup[0] == "P") {
                            typeName = "Practical";
                        } else {
                            typeName = "Unknown";
                            logger.error("unknown type", {
                                courseCode,
                                sessionGroup,
                                course,
                            });
                        }
                        const expectedGroup =
                            courseCode +
                            " - " +
                            group.slice(0, idx) +
                            sessionGroup.slice(1).replace(/^0+/, "") +
                            " (" +
                            typeName +
                            ")";
                        return {
                            courseCode,
                            type,
                            location: s[1].textContent,
                            group,
                            expectedGroup,
                        };
                    });
                });
        });
    return ret;
};

const parseGroupSchedules = (schedules: ReturnType<typeof extractGroupSchedules>[]) => {
    const ret: Parsed.Schedule = {};
    for (const schedule of schedules)
        for (let i = 0; i < schedule.length; i += 1)
            for (let j = 0; j < schedule[i].length; j += 1)
                if (schedule[i][j])
                    for (const session of schedule[i][j]) {
                        if (!ret[session.expectedGroup]) ret[session.expectedGroup] = [];
                        ret[session.expectedGroup].push({
                            x: i,
                            y: j,
                            location: session.location ?? undefined,
                        });
                    }

    return ret;
};

// gets the group schedule from the guc website and saves it to the store
const downloadGroupSchedule = async (groupScheduleData: Stored.Group) => {
    const { view_state: viewState, event_validation: eventValidation } = await groupScheduleRequestDetails();

    const rawGroupsSchedules = await Promise.all(
        groupScheduleData.id.map(async (id) => {
            const formData = {
                __VIEWSTATE: viewState,
                __EVENTVALIDATION: eventValidation,
                scdTpLst: id,
                __EVENTTARGET: "scdTpLst",
            };
            // const rawGroupsSchedules = await doPostRequest(generalGroupScheduleUrl, formData);
            const rawGroupsSchedule = await doPostRequest({
                url: generalGroupScheduleUrl,
                formData,
            });
            return rawGroupsSchedule;
        })
    );
    const schedules = rawGroupsSchedules.map((rawGroupsSchedule) => extractGroupSchedules(rawGroupsSchedule));

    const groupsSchedules = parseGroupSchedules(schedules);

    logger.debug(`downloaded group_schedule ${JSON.stringify({ groupScheduleData, groupsSchedules })}`);
    return groupsSchedules;
};

// returns the group schedule from either the store or calling downloadGroupSchedule
const getGroupSchedule = async ({ groupName }: { groupName: string }) => {
    if (!groupName) throw "invalid group";

    const docRef = groupFirestore(groupName);

    const doc = await docRef.get();
    const groupScheduleData = doc.data() as Stored.Group | undefined;
    if (!doc.exists || !groupScheduleData) throw "group does not exist";

    const updateTime = doc.updateTime?.toMillis() ?? 0;

    const time = currentTime();

    const isExpired = updateTime + groupScheduleMaxAge < time;
    const isLoaded = groupScheduleData.loaded;
    if (!isExpired && isLoaded) return groupScheduleData;

    const newGroupSchedule = await downloadGroupSchedule(groupScheduleData);

    const newDocData = {
        loaded: true,
        sched: newGroupSchedule,
        lastUpdateTime: time,
    };

    await docRef.set(newDocData, { merge: true });

    return { ...groupScheduleData, ...newDocData };
};

export const groupsScheduleDataLoader = new DataLoader(
    async (groupNames: readonly string[]) => {
        const groupSchedules = await Promise.allSettled(groupNames.map((groupName) => getGroupSchedule({ groupName })));
        return groupSchedules;
    },
    { cache: false }
);
