export const maxPostRetries = 2;
export const maxGetRetries = 2;

export const courseDataMaxAge = 1000 * 60 * 60 * 6; // in millis
export const groupScheduleMaxAge = 1000 * 60 * 60 * 6; // in millis

export const generalGroupScheduleUrl = "https://student.guc.edu.eg/Web/Student/Schedule/GeneralGroupSchedule.aspx";
export const academicScheduleUrl =
    "https://student.guc.edu.eg/External/LSI/EDUMS/CSMS/SearchAcademicScheduled_001.aspx";
export const studentDataReportUrl = "https://student.guc.edu.eg/External/Student/CourseGroup/StudentDataReport.aspx";

export const runtimeOptsGetStudentSchedule = {
    timeoutSeconds: 120,
    memory: "256MiB",
    maxInstances: 30,
    region: "europe-west1",
} as const;
export const runtimeOptsPrepareCourses = {
    timeoutSeconds: 540,
    memory: "1GiB",
    maxInstances: 1,
    region: "europe-west1",
} as const;

export const ENG = "eng";
export const LAW = "law";

export const courseCategories: {
    [courseCode: string]: string;
} = {
    ABSK: LAW,
    ARCH: ENG,
    BINF: LAW,
    BIOT: LAW,
    BIOTp: LAW,
    BIOTt: LAW,
    CHEMt: LAW,
    CICO: LAW,
    CIG: ENG,
    CILA: LAW,
    CIS: ENG,
    CIT: ENG,
    CIW: ENG,
    CLPH: LAW,
    CLPHp: LAW,
    CLPHt: LAW,
    CMLA: LAW,
    COLA: LAW,
    COMM: ENG,
    CRLA: LAW,
    CSEN: ENG,
    CSIS: ENG,
    CTRL: ENG,
    DMET: ENG,
    ECON: ENG,
    EDPT: ENG,
    ELCT: ENG,
    ELECp: ENG,
    ELECt: ENG,
    ENGD: ENG,
    ENME: ENG,
    FINC: ENG,
    GD: ENG,
    GMAT: ENG,
    HROB: LAW,
    IBUS: ENG,
    INNO: ENG,
    INSY: ENG,
    ISSH: LAW,
    LAW: LAW,
    LAWS: LAW,
    MATS: ENG,
    MCTR: ENG,
    MGMT: ENG,
    MRKT: ENG,
    NETW: ENG,
    OPER: ENG,
    PD: LAW,
    PEPF: LAW,
    PHBC: LAW,
    PHBCp: LAW,
    PHBCt: LAW,
    PHBL: LAW,
    PHBLp: LAW,
    PHBLt: LAW,
    PHBT: LAW,
    PHBTp: LAW,
    PHBTt: LAW,
    PHCMp: LAW,
    PHCMt: LAW,
    PHMU: LAW,
    PHMUp: LAW,
    PHMUt: LAW,
    PHTC: LAW,
    PHTCp: LAW,
    PHTCt: LAW,
    PHTX: LAW,
    PHYS: ENG,
    PHYSp: ENG,
    PHYSt: ENG,
    PRIN: LAW,
    PUIN: LAW,
    STRA: ENG,
    UP: ENG,
};
