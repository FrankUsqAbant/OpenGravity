import { getCurrentTimeSchema, getCurrentTime } from './getCurrentTime.js';
import { sendVoiceResponseSchema, sendVoiceResponse } from './sendVoiceResponse.js';
import { 
    gmailSearchSchema, gmailSearch,
    gmailSendSchema, gmailSend,
    calendarListEventsSchema, calendarListEvents,
    calendarCreateEventSchema, calendarCreateEvent,
    driveSearchSchema, driveSearch,
    docsCatSchema, docsCat,
    sheetsGetSchema, sheetsGet,
    sheetsAppendSchema, sheetsAppend,
    contactsListSchema, contactsList
} from './googleWorkspace.js';

export const availableTools = {
    get_current_time: getCurrentTime,
    send_voice_response: sendVoiceResponse,
    gmail_search: gmailSearch,
    gmail_send: gmailSend,
    calendar_list_events: calendarListEvents,
    calendar_create_event: calendarCreateEvent,
    drive_search: driveSearch,
    docs_cat: docsCat,
    sheets_get: sheetsGet,
    sheets_append: sheetsAppend,
    contacts_list: contactsList
};

export const toolsSchema = [
    getCurrentTimeSchema,
    sendVoiceResponseSchema,
    gmailSearchSchema,
    gmailSendSchema,
    calendarListEventsSchema,
    calendarCreateEventSchema,
    driveSearchSchema,
    docsCatSchema,
    sheetsGetSchema,
    sheetsAppendSchema,
    contactsListSchema
];
