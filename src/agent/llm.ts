import OpenAI from 'openai';
import { config } from '../config.js';
import { toolsSchema } from '../tools/index.js';
import { Groq } from 'groq-sdk';
import fs from 'fs';

// Configuración de OpenRouter (usando SDK de OpenAI compatible)
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://opengravity.local", // Requerido por OpenRouter
        "X-Title": "OpenGravity",
    }
});

// Groq solo para transcripción de audio (Whisper)
const groq = new Groq({
    apiKey: config.GROQ_API_KEY
});

const DEFAULT_MODEL = config.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";

export async function callLLM(messages: any[]) {
    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: messages,
            tools: toolsSchema as any,
            tool_choice: "auto",
        });

        return response.choices[0].message;
    } catch (error: any) {
        console.error("Error al llamar a OpenRouter API:", error.message);
        throw new Error("El modelo LLM (OpenRouter) falló.");
    }
}

export async function transcribeAudio(filePath: string): Promise<string> {
    try {
        // Intentamos usar Groq para audio, si falla, notificamos
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
