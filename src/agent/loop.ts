import { callLLM } from './llm.js';
import { getChatHistory, saveMessage } from '../db/firebase.js';
import { availableTools } from '../tools/index.js';

const SYSTEM_PROMPT = `
Eres OpenGravity, un agente de IA personal creado desde cero, funcionando localmente.
Tu interfaz principal es Telegram. Tu objetivo es ser extremadamente útil, claro, y seguro.
Respondes siempre en español. Puedes usar herramientas si es necesario.
`;

const MAX_ITERATIONS = 5;

export async function processUserMessage(userMessage: string): Promise<string> {
    // 1. Guardar mensaje del usuario
    await saveMessage('user', userMessage);

    // 2. Obtener el historial reciente (ej: 20 últimos)
    const history = await getChatHistory(20);

    // 3. Preparar los mensajes para el LLM
    const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
    ];

    let iteration = 0;

    // Agent Loop
    while (iteration < MAX_ITERATIONS) {
        iteration++;
        
        // Llamar al LLM
        const responseMessage = await callLLM(messages);
        
        messages.push(responseMessage);

        // Si el LLM quiere llamar a una herramienta
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name as keyof typeof availableTools;
                const toolFunction = availableTools[functionName];

                if (toolFunction) {
                    try {
                        console.log(`Ejecutando herramienta: ${functionName}`);
                        const result = await toolFunction();
                        
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: result
                        });
                    } catch (err: any) {
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({ error: err.message })
                        });
                    }
                } else {
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: 'Herramienta no encontrada' })
                    });
                }
            }
        } else {
            // Si no hay tool calls, terminamos el loop y devolvemos la respuesta al usuario
            const finalContent = responseMessage.content || '';
            await saveMessage('assistant', finalContent);
            return finalContent;
        }
    }

    const abortMsg = "He alcanzado el límite máximo de iteraciones de pensamiento. Por favor, intenta ser más específico.";
    await saveMessage('assistant', abortMsg);
    return abortMsg;
}
