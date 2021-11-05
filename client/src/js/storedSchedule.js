const saveSchedule = (schedule) => {
    const stringSchedule = JSON.stringify(schedule);
    localStorage.setItem("stored_schedule_0", stringSchedule);
};

const retrieveSchedule = () => {
    const stringSchedule = localStorage.getItem("stored_schedule_0");
    console.log(stringSchedule);
    return stringSchedule ? JSON.parse(stringSchedule) : [];
};

export { saveSchedule, retrieveSchedule };
