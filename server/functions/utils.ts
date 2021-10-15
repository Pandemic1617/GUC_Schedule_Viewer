const lazyVariable: <T>(func: () => Promise<T>) => () => Promise<T> = <T>(func: () => Promise<T>) => {
    let loaded: Boolean = false;
    let called: Boolean = false;
    let waitList: Array<Array<Function>> = [];
    let value: T;

    const callFunc: () => Promise<void> = async () => {
        called = true;
        try {
            value = await func();
            loaded = true;
            for (const [resolve, reject] of waitList) resolve(value);
            waitList = [];
        } catch (error) {
            for (const [resolve, reject] of waitList) reject(error);
            loaded = false;
            called = false;
            waitList = [];
        }
    };

    const get: () => Promise<T> = () => {
        return new Promise((resolve, reject) => {
            if (loaded) {
                resolve(value);
            } else {
                waitList.push([resolve, reject]);
                if (!called) callFunc();
            }
        });
    };

    return get;
};

const currentTime = () => new Date().getTime(); // returns the current time in millis;

const doRetries: <T>(func: () => Promise<T>, maxRetries: number) => Promise<T> = async (func, maxRetries) => {
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

export { lazyVariable, currentTime, doRetries };
