const saveSchedule = (schedule) => {
    const stringSchedule = JSON.stringify(schedule);
    localStorage.setItem("stored_schedule_0", stringSchedule);
};

const retrieveSchedule = () => {
    const stringSchedule = localStorage.getItem("stored_schedule_0");
    console.log(stringSchedule);
    const ret = stringSchedule ? JSON.parse(stringSchedule) : [];

    if (Array.isArray(ret)) {
        return {
            schedCategory: "",
            slots: ret,
        };
    }

    return ret;
};

export { saveSchedule, retrieveSchedule };
