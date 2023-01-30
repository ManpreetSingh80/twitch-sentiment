import * as analytics from './analytics.js';

export function error(...args) {
    console.error(args);
}

export const info = (...args) => console.info(...args);
export const debug = (...args) => console.log(...args);
export const warning = (...args) => console.warning(...args);