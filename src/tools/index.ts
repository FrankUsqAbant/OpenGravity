import { getCurrentTimeSchema, getCurrentTime } from './getCurrentTime.js';

export const availableTools = {
    get_current_time: getCurrentTime
};

export const toolsSchema = [
    getCurrentTimeSchema
];
