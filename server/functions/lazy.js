"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyVariable = void 0;
let lazyVariable = (func) => {
    let loaded = false;
    let called = false;
    let waitList = [];
    let value;
    const callFunc = () => __awaiter(void 0, void 0, void 0, function* () {
        called = true;
        try {
            value = yield func();
            loaded = true;
            for (let [resolve, reject] of waitList)
                resolve(value);
            waitList = [];
        }
        catch (error) {
            for (let [resolve, reject] of waitList)
                reject(error);
            loaded = false;
            called = false;
            waitList = [];
        }
    });
    const get = () => {
        if (loaded) {
            return new Promise((resolve, reject) => {
                resolve(value);
            });
        }
        else {
            return new Promise((resolve, reject) => {
                waitList.push([resolve, reject]);
                if (!called)
                    callFunc();
            });
        }
    };
    return get;
};
exports.lazyVariable = lazyVariable;
