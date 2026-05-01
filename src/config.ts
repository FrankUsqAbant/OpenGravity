import dotenv from 'dotenv';
dotenv.config();

export const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
    TELEGRAM_ALLOWED_USER_IDS: (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map(id => id.trim()),
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
    DB_PATH: process.env.DB_PATH || './memory.db',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
};

// Validate critical config
if (!config.TELEGRAM_BOT_TOKEN) {
    console.error("Falta TELEGRAM_BOT_TOKEN en .env");
    process.exit(1);
}
if (!config.GROQ_API_KEY) {
    console.error("Falta GROQ_API_KEY en .env");
    process.exit(1);
}
if (config.TELEGRAM_ALLOWED_USER_IDS.length === 0 || config.TELEGRAM_ALLOWED_USER_IDS[0] === '') {
    console.error("Falta TELEGRAM_ALLOWED_USER_IDS en .env");
    process.exit(1);
}
