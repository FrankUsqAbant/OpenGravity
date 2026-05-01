import { Groq } from 'groq-sdk';
import { config } from '../config.js';
import { toolsSchema } from '../tools/index.js';
import fs from 'fs';

const groq = new Groq({
    apiKey: config.GROQ_API_KEY
});

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function callLLM(messages: any[]) {
    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: messages,
            tools: toolsSchema as any,
            tool_choice: "auto",
        });

        return response.choices[0].message;
    } catch (error) {
        console.error("Error al llamar a Groq API:", error);
        throw new Error("El modelo LLM falló.");
    }
}

export async function transcribeAudio(filePath: string): Promise<string> {
    try {
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3",
        });
        return transcription.text;
    } catch (error) {
        console.error("Error al transcribir audio en Groq:", error);
        throw new Error("La transcripción de audio falló.");
    }
}
