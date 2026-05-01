export const getCurrentTimeSchema = {
    type: "function",
    function: {
        name: "get_current_time",
        description: "Obtiene la hora actual del sistema en formato ISO 8601.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
};

export async function getCurrentTime(): Promise<string> {
    const now = new Date();
    return JSON.stringify({ currentTime: now.toISOString() });
}
