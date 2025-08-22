"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
function getEnv(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}
