let escapeHTML = (text) => {
    let a = document.createElement("div");
    a.appendChild(document.createTextNode(text));
    return a.innerHTML;
};

// parses the schedule input as given from the api into an array ready to be rendered
let parseScheudle = (inSched) => {
    let out = new Array(7).fill(0).map((e) => {
        return new Array(5).fill(0).map((e) => []);
    });

    for (let course of inSched) {
        for (let session of course.sessions) {
            let ret = {};

            ret.courseCode = course.course_code;
            ret.type = course.type;
            ret.tutorialGroup = course.tut_group;
            ret.location = session.location;
            ret.staff = session.staff;

            out[session.x][session.y].push(ret); // maybe y >=5 ie. something after the 5th session
        }
    }

    let cnt = Array(7).fill(0);
    for (let i = 0; i < out.length; i++) for (let blah of out[i]) cnt[i] += blah.length;

    if (cnt[6] === 0) out.pop();
    console.debug("parseSchedule", out);
    return out;
};

export { escapeHTML, parseScheudle };
