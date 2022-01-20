import { initializeApp } from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { getStudentSchedule } from "./getStudentSchedule";
import { prepareCourses } from "./prepareCourses";
import { PASSWORD } from "./env";
import { safeCompare } from "./utils";
import { runtimeOptsGetStudentSchedule, runtimeOptsPrepareCourses } from "./consts";

export const get_student_schedule = onRequest(runtimeOptsGetStudentSchedule, (request, response) => {
    const id = request.query.id as string;
    if (typeof id !== "string") {
        response.status(400).send("invalid id");
        return;
    }
    getStudentSchedule(id)
        .then((result) => {
            response.send(result);
        })
        .catch((err) => {
            logger.error(err);
            response.status(500).send("internal error");
        });
});

export const prepare_courses = onRequest(runtimeOptsPrepareCourses, (request, response) => {
    const key = request.query.key;
    if (typeof key !== "string") {
        response.status(400).send("invalid key");
        return;
    }
    if (!safeCompare(key, PASSWORD.value())) {
        response.status(500).send({ error: "whatcha doin" });
        return;
    }

    const loaded = request.query.loaded === "true";

    prepareCourses({ loaded })
        .then(() => {
            response.send("done");
        })
        .catch((err) => {
            logger.error(err);
            response.status(500).send("internal error");
        });
});

setTimeout(() => initializeApp());
