import { Bot } from 'grammy';
import { config } from './config.js';
import { processUserMessage } from './agent/loop.js';

export function setupBot() {
    const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

    // Middleware de seguridad: Whitelist de usuarios
    bot.use(async (ctx, next) => {
        const userId = ctx.from?.id.toString();
        if (!userId || !config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
            console.warn(`Intento de acceso denegado del usuario: ${userId}`);
            return; // Ignorar silenciosamente
        }
        await next();
    });

    bot.command("start", async (ctx) => {
        await ctx.reply("¡Hola! Soy OpenGravity. Estoy listo para ayudarte.");
    });

    bot.on("message:text", async (ctx) => {
        const text = ctx.message.text;
        
        // Indicador de "escribiendo..."
        await ctx.replyWithChatAction("typing");

        try {
            const response = await processUserMessage(text);
            await ctx.reply(response);
        } catch (error) {
            console.error("Error procesando mensaje:", error);
            await ctx.reply("Ha ocurrido un error interno al procesar tu solicitud.");
        }
    });

    return bot;
}
