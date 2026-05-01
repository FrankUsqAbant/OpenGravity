import { getCurrentTimeSchema, getCurrentTime } from './getCurrentTime.js';
import { sendVoiceResponseSchema, sendVoiceResponse } from './sendVoiceResponse.js';

export const availableTools = {
    get_current_time: getCurrentTime,
    send_voice_response: sendVoiceResponse
};

export const toolsSchema = [
    getCurrentTimeSchema,
    sendVoiceResponseSchema
];
