import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Este script asegura que gogcli tenga sus credenciales listas,
 * incluso en entornos como Render donde el disco se borra al reiniciar.
 */
export function initGoogleWorkspace() {
    const isLinux = process.platform === 'linux';
    const configDir = isLinux 
        ? path.join(os.homedir(), '.config', 'gogcli')
        : path.join(process.env.APPDATA || '', 'gogcli');
    const keyringDir = path.join(configDir, 'keyring');

    console.log(`[GoogleInit] Verificando configuración en: ${configDir}`);

    // Crear directorios si no existen
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    if (!fs.existsSync(keyringDir)) fs.mkdirSync(keyringDir, { recursive: true });

    // 1. Escribir credentials.json (Client ID / Secret)
    const credsJson = process.env.GOG_CREDENTIALS_JSON;
    if (credsJson) {
        fs.writeFileSync(path.join(configDir, 'credentials.json'), credsJson);
        console.log('[GoogleInit] credentials.json restaurado desde env.');
    }

    // 2. Escribir config.json (Forzar backend: file)
    const configData = {
        keyring_backend: 'file'
    };
    fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(configData, null, 2));

    // 3. Restaurar archivos del keyring
    const keyringDataStr = process.env.GOG_KEYRING_DATA;
    if (keyringDataStr) {
        try {
            const keyringData = JSON.parse(keyringDataStr);
            for (const [filename, content] of Object.entries(keyringData)) {
                fs.writeFileSync(path.join(keyringDir, filename), content as string);
            }
            console.log('[GoogleInit] Keyring restaurado con éxito.');
        } catch (e) {
            console.error('[GoogleInit] Error al parsear GOG_KEYRING_DATA:', e);
        }
    }
}
