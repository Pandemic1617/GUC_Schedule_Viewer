import { firestore } from "firebase-admin";

export const courseFirestore = (courseCode: string) =>
    firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("course_" + courseCode)
        .doc("info");

export const getCoursesInfoFirestore = () => firestore().collection("schedules").doc("get_courses_info");

export const groupFirestore = (groupName: string) =>
    firestore()
        .collection("schedules")
        .doc("student_schedules")
        .collection("group_" + groupName)
        .doc("info");

export const getGroupsInfoFirestore = () => firestore().collection("schedules").doc("get_group_schedules_info");
