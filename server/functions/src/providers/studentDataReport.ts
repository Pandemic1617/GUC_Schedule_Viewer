import { logger } from "firebase-functions/v2";
import { JSDOM } from "jsdom";
import { studentDataReportUrl } from "../consts";
import { doGetRequest } from "../requests";
import DataLoader = require("dataloader");

// parses the raw HTML to return the courses that a student takes
const parseGetStudentDataReport = (data: string) => {
    const doc = new JSDOM(data).window.document;

    if (doc.querySelector("#L_Info1")?.textContent?.trim()) {
        throw "invalid id provided";
    }
    const children = doc.querySelector("#DG_ChangeGroupOffers")?.firstElementChild?.children;
    if (!children) throw new Error("no children found");
    const ret = Array.from(children)
        .slice(1)
        .map((v) => {
            const courseInfo = v.children[0].textContent;
            const groupInfo = v.children[1].textContent;

            if (!courseInfo || !groupInfo) throw new Error("no courseInfo or groupInfo found");

            const [courseGroupName, courseCombinedName] = courseInfo.split(" - ");
            const matchResult = courseCombinedName.match(/^\s*([A-Za-z]+)(\s*[\d]+)/);
            if (!matchResult) throw new Error("no match found");
            const [courseCode, courseMatchAlpha, courseMatchNum] = matchResult;
            const spIndex = courseCode.length;
            const courseLongName = courseCombinedName.slice(spIndex + 1);
            const tutorialGroup = groupInfo.slice(groupInfo.lastIndexOf(" ") + 1);
            const type = tutorialGroup[0];
            const attendanceGroup =
                groupInfo.slice(0, groupInfo.lastIndexOf(" ")) + tutorialGroup.slice(1).replace(/^0+/, "");

            let typeName = "";
            if (type == "T") {
                typeName = "Tutorial";
            } else if (type == "L") {
                typeName = "Lecture";
            } else if (type == "P") {
                typeName = "Practical";
            } else {
                typeName = "Unknown";
                logger.error("unknown type", { courseInfo, groupInfo });
            }

            const courseCodeSp = courseMatchAlpha + " " + courseMatchNum;
            const expectedGroup = courseCodeSp + " - " + attendanceGroup + " (" + typeName + ")";

            return {
                courseCode,
                type,
                attendanceGroup,
                tutorialGroup,
                expectedGroup,
                typeName,
                courseGroupName,
            };
        });
    return ret;
};

// returns the courses a student takes by requesting it from guc.edu.eg
export const getStudentDataReport = async (id: string) => {
    if (!/^\d{1,2}-\d{4,5}$/.test(id)) throw "invalid id";

    const studentDataReport = await doGetRequest({
        url: studentDataReportUrl,
        qs: {
            StudentAppNo: id,
        },
    }).then(parseGetStudentDataReport);

    logger.debug(`got studentDataReport for ${id} ${JSON.stringify({ studentDataReport })}`);

    return studentDataReport;
};
