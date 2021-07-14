let lazyVariable: <T>(func: () => Promise<T>) => () => Promise<T> = <T>(func: () => Promise<T>) => {
    let loaded: Boolean = false;
    let called: Boolean = false;
    let waitList: Array<Array<Function>> = [];
    let value: T;

    const callFunc: () => Promise<void> = async () => {
        called = true;
        try {
            value = await func();
            loaded = true;
            for (let [resolve, reject] of waitList) resolve(value);
            waitList = [];
        } catch (error) {
            for (let [resolve, reject] of waitList) reject(error);
            loaded = false;
            called = false;
            waitList = [];
        }
    };

    const get: () => Promise<T> = () => {
        if (loaded) {
            return new Promise((resolve, reject) => {
                resolve(value);
            });
        } else {
            return new Promise((resolve, reject) => {
                waitList.push([resolve, reject]);
                if (!called) callFunc();
            });
        }
    };

    return get;
};

export { lazyVariable };
