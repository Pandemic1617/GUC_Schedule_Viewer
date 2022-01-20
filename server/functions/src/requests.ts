import * as ntlm from "request-ntlm-promise";
import { maxGetRetries, maxPostRetries } from "./consts";
import { doRetries } from "./utils";
import qs = require("qs");
import { USERNAME, PASSWORD } from "./env";

const defaultHeaders = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
    Cookie: "ASP.NET_SessionId=000000000000000000000000",
    Origin: "https://student.guc.edu.eg",
    Host: "student.guc.edu.eg",
    Referer: "https://student.guc.edu.eg/External/Student/CourseGroup/StudentDataReport.aspx",
};

export const doPostRequest = async ({ url, formData }: { url: string; formData: any }) => {
    return doRetries(async () => {
        const resp = await ntlm.post({
            username: USERNAME.value(),
            password: PASSWORD.value(),
            url,
            headers: {
                ...defaultHeaders,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: qs.stringify(formData),
        });

        if (resp == undefined) throw "doPostRequest, result is undefined";

        return resp;
    }, maxPostRetries);
};

export const doGetRequest = async ({ url, qs }: { url: string; qs?: any }) => {
    return doRetries(async () => {
        const resp = await ntlm.get({
            username: USERNAME.value(),
            password: PASSWORD.value(),
            url,
            qs,
            headers: defaultHeaders,
        });

        if (resp == undefined) throw "doGetRequest, result is undefined";

        return resp;
    }, maxGetRetries);
};
