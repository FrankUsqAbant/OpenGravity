import { execSync } from 'child_process';
import { config } from '../config.js';
import path from 'path';

/**
 * Helper para ejecutar comandos de gogcli y parsear el resultado JSON.
 */
function runGogCommand(args: string): any {
    try {
        const isWindows = process.platform === 'win32';
        const gogPath = path.join(process.cwd(), isWindows ? 'gog.exe' : 'gog');
        const accountArg = config.GOG_ACCOUNT ? `--account ${config.GOG_ACCOUNT}` : '';
        const password = process.env.GOG_KEYRING_PASSWORD || 'opengravity_secret';
        
        const command = isWindows
            ? `powershell -Command "$env:GOG_KEYRING_PASSWORD='${password}'; & '${gogPath}' ${args} ${accountArg} --json --no-input"`
            : `GOG_KEYRING_PASSWORD='${password}' "${gogPath}" ${args} ${accountArg} --json --no-input`;

        console.log(`Ejecutando: ${command}`);
        const output = execSync(command, { encoding: 'utf8' });
        return JSON.parse(output);
    } catch (error: any) {
        console.error("Error ejecutando gogcli:", error.message);
        try {
            const match = error.message.match(/\{.*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e) {}
        return { error: error.message };
    }
}

// --- GMAIL ---

export const gmailSearchSchema = {
    type: "function",
    function: {
        name: "gmail_search",
        description: "Busca correos en Gmail.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Consulta (ej: 'from:google', 'is:unread')." },
                max: { type: "number", description: "Máximo de resultados (def 5)." }
            },
            required: ["query"]
        }
    }
};

export async function gmailSearch({ query, max = 5 }: { query: string, max?: number }) {
    return JSON.stringify(runGogCommand(`gmail messages search "${query}" --max ${max}`));
}

export const gmailSendSchema = {
    type: "function",
    function: {
        name: "gmail_send",
        description: "Envía un correo electrónico.",
        parameters: {
            type: "object",
            properties: {
                to: { type: "string", description: "Email del destinatario." },
                subject: { type: "string", description: "Asunto del correo." },
                body: { type: "string", description: "Cuerpo del mensaje (texto plano)." }
            },
            required: ["to", "subject", "body"]
        }
    }
};

export async function gmailSend({ to, subject, body }: { to: string, subject: string, body: string }) {
    return JSON.stringify(runGogCommand(`gmail send --to "${to}" --subject "${subject}" --body "${body}"`));
}

// --- CALENDAR ---

export const calendarListEventsSchema = {
    type: "function",
    function: {
        name: "calendar_list_events",
        description: "Lista eventos del calendario.",
        parameters: {
            type: "object",
            properties: {
                days: { type: "number", description: "Días a futuro (def 7)." }
            }
        }
    }
};

export async function calendarListEvents({ days = 7 }: { days?: number }) {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    return JSON.stringify(runGogCommand(`calendar events primary --from ${now.toISOString()} --to ${future.toISOString()}`));
}

export const calendarCreateEventSchema = {
    type: "function",
    function: {
        name: "calendar_create_event",
        description: "Crea un evento en el calendario.",
        parameters: {
            type: "object",
            properties: {
                summary: { type: "string", description: "Título del evento." },
                start: { type: "string", description: "Fecha/hora inicio (ISO 8601, ej: 2024-05-02T10:00:00Z)." },
                end: { type: "string", description: "Fecha/hora fin (ISO 8601)." },
                description: { type: "string", description: "Descripción opcional." }
            },
            required: ["summary", "start", "end"]
        }
    }
};

export async function calendarCreateEvent({ summary, start, end, description }: { summary: string, start: string, end: string, description?: string }) {
    let cmd = `calendar create primary --summary "${summary}" --from "${start}" --to "${end}"`;
    if (description) cmd += ` --description "${description}"`;
    return JSON.stringify(runGogCommand(cmd));
}

// --- DRIVE & DOCS ---

export const driveSearchSchema = {
    type: "function",
    function: {
        name: "drive_search",
        description: "Busca archivos en Google Drive.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Nombre o tipo de archivo." }
            },
            required: ["query"]
        }
    }
};

export async function driveSearch({ query }: { query: string }) {
    return JSON.stringify(runGogCommand(`drive search "${query}" --max 10`));
}

export const docsCatSchema = {
    type: "function",
    function: {
        name: "docs_cat",
        description: "Lee el contenido de un documento de Google Docs.",
        parameters: {
            type: "object",
            properties: {
                docId: { type: "string", description: "ID del documento." }
            },
            required: ["docId"]
        }
    }
};

export async function docsCat({ docId }: { docId: string }) {
    return JSON.stringify(runGogCommand(`docs cat ${docId}`));
}

// --- SHEETS ---

export const sheetsGetSchema = {
    type: "function",
    function: {
        name: "sheets_get",
        description: "Lee datos de una hoja de cálculo.",
        parameters: {
            type: "object",
            properties: {
                sheetId: { type: "string", description: "ID de la hoja." },
                range: { type: "string", description: "Rango (ej: 'Hoja1!A1:B10')." }
            },
            required: ["sheetId", "range"]
        }
    }
};

export async function sheetsGet({ sheetId, range }: { sheetId: string, range: string }) {
    return JSON.stringify(runGogCommand(`sheets get ${sheetId} "${range}"`));
}

export const sheetsAppendSchema = {
    type: "function",
    function: {
        name: "sheets_append",
        description: "Añade una fila a una hoja de cálculo.",
        parameters: {
            type: "object",
            properties: {
                sheetId: { type: "string", description: "ID de la hoja." },
                range: { type: "string", description: "Rango (ej: 'A:C')." },
                values: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Lista de valores para la nueva fila."
                }
            },
            required: ["sheetId", "range", "values"]
        }
    }
};

export async function sheetsAppend({ sheetId, range, values }: { sheetId: string, range: string, values: string[] }) {
    const valuesJson = JSON.stringify([values]);
    return JSON.stringify(runGogCommand(`sheets append ${sheetId} "${range}" --values-json '${valuesJson}' --insert INSERT_ROWS`));
}

// --- CONTACTS ---

export const contactsListSchema = {
    type: "function",
    function: {
        name: "contacts_list",
        description: "Lista tus contactos de Google.",
        parameters: {
            type: "object",
            properties: {
                max: { type: "number", description: "Máximo de contactos (def 20)." }
            }
        }
    }
};

export async function contactsList({ max = 20 }: { max?: number }) {
    return JSON.stringify(runGogCommand(`contacts list --max ${max}`));
}
