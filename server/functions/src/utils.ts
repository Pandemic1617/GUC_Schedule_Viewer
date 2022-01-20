import { timingSafeEqual } from "crypto";

export const currentTime = () => new Date().getTime(); // returns the current time in millis;

export const doRetries: <T>(func: () => Promise<T>, maxRetries: number) => Promise<T> = async (func, maxRetries) => {
    // func is executed atmost 1 + maxRetries times
    let retries = 0;
    while (true) {
        try {
            return await func();
        } catch (err) {
            if (retries++ >= maxRetries) throw err;
        }
    }
};

export const uniqueItems = <T>(arr: Array<T>): Array<T> => {
    return Array.from(new Set(arr));
};

export const safeCompare = (a: string, b: string) => {
    const A = Buffer.from(a);
    const B = Buffer.from(b);
    if (A.length !== B.length) return false;
    return timingSafeEqual(A, B);
};
