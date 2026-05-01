import { callLLM } from './llm.js';
import { getChatHistory, saveMessage } from '../db/firebase.js';
import { availableTools } from '../tools/index.js';

const SYSTEM_PROMPT = `
Eres OpenGravity, un agente de IA personal creado desde cero, funcionando localmente.
Tu interfaz principal es Telegram. Tu objetivo es ser extremadamente útil, claro, y seguro.
Respondes siempre en español. Puedes usar herramientas si es necesario.
Solo genera notas de voz si el usuario te lo pide explícitamente usando la herramienta send_voice_response.
`;

const MAX_ITERATIONS = 5;

export interface AgentResponse {
    content: string;
    voicePath?: string;
}

export async function processUserMessage(userMessage: string): Promise<AgentResponse> {
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
    let voicePath: string | undefined;

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
                        const args = JSON.parse(toolCall.function.arguments || '{}');
                        const result = await (toolFunction as any)(args);
                        
                        // Si es la herramienta de voz, capturamos la ruta del archivo
                        if (functionName === 'send_voice_response') {
                            const parsed = JSON.parse(result);
                            if (parsed.filePath) {
                                voicePath = parsed.filePath;
                            }
                        }

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
            return { content: finalContent, voicePath };
        }
    }

    const abortMsg = "He alcanzado el límite máximo de iteraciones de pensamiento. Por favor, intenta ser más específico.";
    await saveMessage('assistant', abortMsg);
    return { content: abortMsg };
}
