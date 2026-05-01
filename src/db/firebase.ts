import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

let db: FirebaseFirestore.Firestore;

export async function initDB() {
    // Leemos el service account manualmente para no depender de process.env que a veces falla en Windows
    const serviceAccountPath = path.resolve(config.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`No se encontró el archivo de credenciales en: ${serviceAccountPath}`);
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    initializeApp({
        credential: cert(serviceAccount)
    });

    db = getFirestore();
    console.log("Firebase Firestore inicializado correctamente.");
}

export async function saveMessage(role: 'user' | 'assistant' | 'system', content: string) {
    await db.collection('messages').add({
        role,
        content,
        timestamp: FieldValue.serverTimestamp()
    });
}

export async function getChatHistory(limit: number = 20) {
    // Obtenemos los últimos X mensajes ordenados por timestamp ascendente
    const snapshot = await db.collection('messages')
        .orderBy('timestamp', 'asc')
        .limitToLast(limit)
        .get();

    const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            role: data.role as 'user' | 'assistant' | 'system',
            content: data.content
        };
    });

    return messages;
}

export async function clearHistory() {
    const snapshot = await db.collection('messages').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
