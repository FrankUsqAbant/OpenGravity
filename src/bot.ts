import { Bot, InputFile } from 'grammy';
import { config } from './config.js';
import { processUserMessage } from './agent/loop.js';
import { transcribeAudio } from './agent/llm.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { pipeline } from 'stream/promises';

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
        console.log(`Mensaje recibido de ${ctx.from.id}: ${text}`);
        await handleBotResponse(ctx, text);
    });

    bot.on(["message:voice", "message:audio"], async (ctx) => {
        await ctx.replyWithChatAction("typing");
        
        const file = await ctx.getFile();
        const filePath = path.join(process.cwd(), `temp_${Date.now()}_${file.file_id}`);
        
        try {
            // Descargar archivo de Telegram
            const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            await downloadFile(url, filePath);

            // Transcribir con Groq
            const text = await transcribeAudio(filePath);
            await ctx.reply(`🎤 _Transcripción:_ "${text}"`, { parse_mode: "Markdown" });

            // Procesar con el agente
            await handleBotResponse(ctx, text);

        } catch (error) {
            console.error("Error procesando audio:", error);
            await ctx.reply("Lo siento, no pude procesar o transcribir tu audio.");
        } finally {
            // Borrar archivo temporal
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });

    async function handleBotResponse(ctx: any, text: string) {
        await ctx.replyWithChatAction("typing");
        try {
            const response = await processUserMessage(text);
            
            if (response.voicePath && fs.existsSync(response.voicePath)) {
                await ctx.replyWithChatAction("upload_voice");
                await ctx.replyWithVoice(new InputFile(response.voicePath));
                // Borrar archivo después de enviar
                fs.unlinkSync(response.voicePath);
            }
            
            if (response.content) {
                await ctx.reply(response.content);
            }
        } catch (error) {
            console.error("Error procesando mensaje:", error);
            await ctx.reply("Ha ocurrido un error interno al procesar tu solicitud.");
        }
    }

    async function downloadFile(url: string, dest: string) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Fallo descarga: ${res.statusCode}`));
                    return;
                }
                const fileStream = fs.createWriteStream(dest);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(true);
                });
            }).on('error', reject);
        });
    }

    return bot;
}
