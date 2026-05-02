import { initDB } from './db/firebase.js';
import { setupBot } from './bot.js';
import { initGoogleWorkspace } from './initGoogle.js';
import express from 'express';

async function main() {
    console.log("Iniciando OpenGravity...");
    
    // Inicializar credenciales de Google antes de cualquier otra cosa
    initGoogleWorkspace();

    try {
        // Inicializar Base de Datos
        console.log("Inicializando base de datos local...");
        await initDB();

        // Configurar y arrancar bot de Telegram
        console.log("Configurando bot de Telegram...");
        const bot = setupBot();
        
        bot.catch((err) => {
            console.error("Error global en el bot de Telegram:", err);
        });

        // Arrancar el bot con long-polling
        bot.start({
            onStart: (botInfo) => {
                console.log(`OpenGravity iniciado con éxito. Bot conectado como: @${botInfo.username}`);
            }
        });

        // Servidor Express para Render (evitar caída)
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        app.get('/', (req, res) => {
            res.send('OpenGravity Bot está funcionando 24/7 en la nube!');
        });

        const server = app.listen(PORT, () => {
            console.log(`Servidor web escuchando en el puerto ${PORT}`);
        });

        // Manejar señales de terminación
        process.once('SIGINT', () => {
            console.log('Deteniendo OpenGravity...');
            bot.stop();
            server.close();
        });
        process.once('SIGTERM', () => {
            console.log('Deteniendo OpenGravity...');
            bot.stop();
            server.close();
        });

    } catch (error) {
        console.error("Error crítico durante el arranque:", error);
        process.exit(1);
    }
}

main();
