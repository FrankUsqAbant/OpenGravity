import { Groq } from 'groq-sdk';
import { config } from '../config.js';
import { toolsSchema } from '../tools/index.js';

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
        // Aquí se podría implementar el fallback a OpenRouter si Groq falla
        throw new Error("El modelo LLM falló.");
    }
}
