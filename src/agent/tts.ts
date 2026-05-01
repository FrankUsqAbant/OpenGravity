import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import https from 'https';

const VOICE_ID_ADAM = "pNInz6obpgDQGcFmaJgB";

export async function generateSpeech(text: string): Promise<string> {
    const filePath = path.join(process.cwd(), `voice_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        });

        const options = {
            hostname: 'api.elevenlabs.io',
            path: `/v1/text-to-speech/${VOICE_ID_ADAM}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': config.ELEVENLABS_API_KEY
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                let errorBody = '';
                res.on('data', (chunk) => errorBody += chunk);
                res.on('end', () => reject(new Error(`ElevenLabs API error: ${res.statusCode} - ${errorBody}`)));
                return;
            }

            const fileStream = fs.createWriteStream(filePath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(filePath);
            });
        });

        req.on('error', (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            reject(err);
        });
        req.write(data);
        req.end();
    });
}
