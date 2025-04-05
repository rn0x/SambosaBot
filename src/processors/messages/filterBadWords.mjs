// /processors/messages/filterBadWords.mjs

import fs from 'fs-extra';
import path from 'path';
import client from '../../client.mjs';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';

const BADWORDS_FILE = path.join(config.paths.data, 'badwords.txt');

function loadBadWords() {
    try {
        if (!fs.existsSync(BADWORDS_FILE)) {
            logger.warn('badwords.txt not found!');
            return [];
        }
        const data = fs.readFileSync(BADWORDS_FILE, 'utf-8');
        return data
            .split(/\r?\n/)
            .map(word => word.trim().toLowerCase())
            .filter(Boolean);
    } catch (error) {
        logger.error('Error loading bad words:', error);
        return [];
    }
}

export async function filterBadWords(message, messageMeta, chat) {
    try {
        if (!messageMeta.isGroup || !message.body) return;

        const badWords = loadBadWords();
        const text = message.body.toLowerCase();

        const hasBadWord = badWords.some(badWord => text.includes(badWord));
        if (!hasBadWord) return;

        const botId = client.info.wid._serialized;

        // التحقق مما إذا كان البوت مشرفًا
        const botParticipant = chat.participants.find(p => p.id._serialized === botId);
        if (!botParticipant || !botParticipant.isAdmin) return;

        // حذف الرسالة
        await message.delete(true).catch(() => { });

        // إرسال رسالة تنبيه 
        const senderName = messageMeta.pushname || messageMeta.number;
        await chat.sendMessage(`⚠️ *تنبيه*: الرجاء من العضو الكريم *${senderName}* تجنّب استخدام الألفاظ غير اللائقة.\nدعونا نحافظ على بيئة محترمة تليق بجميع الأعضاء. 🌿`);
        logger.info(`Bad word detected and message deleted in group: ${chat.name}`);

    } catch (error) {
        logger.error('Error in filterBadWords:', error);
    }
}
