import { generateSpeech } from '../agent/tts.js';

export const sendVoiceResponseSchema = {
    type: "function",
    function: {
        name: "send_voice_response",
        description: "Genera una nota de voz con el texto proporcionado. Úsala solo cuando el usuario pida que hables, envíes un audio o una nota de voz.",
        parameters: {
            type: "object",
            properties: {
                text: {
                    type: "string",
                    description: "El texto que será convertido a audio. Sé conciso pero natural."
                }
            },
            required: ["text"]
        }
    }
};

export async function sendVoiceResponse(args: { text: string }): Promise<string> {
    try {
        const filePath = await generateSpeech(args.text);
        // Devolvemos un formato especial que el loop pueda identificar
        return JSON.stringify({ type: 'voice', filePath: filePath, text: args.text });
    } catch (error: any) {
        console.error("Error en sendVoiceResponse:", error);
        return JSON.stringify({ error: error.message });
    }
}
