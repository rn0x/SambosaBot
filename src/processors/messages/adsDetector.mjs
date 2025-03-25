import fs from 'fs-extra';
import path from 'node:path';
import logger from '../../utils/logger.mjs';
import client from '../../client.mjs';
import { config } from '../../../config.mjs';

const ADS_FILE = path.join(config.paths.data, '/ads_keywords.json');

// تحميل الكلمات المحظورة والمسموحة
function loadAdKeywords() {
    try {
        if (!fs.existsSync(ADS_FILE)) {
            fs.writeJsonSync(ADS_FILE, { blacklist: [], whitelist: [] });
        }
        return fs.readJsonSync(ADS_FILE);
    } catch (error) {
        logger.error('Error loading ad keywords:', error);
        return { blacklist: [], whitelist: [] };
    }
}

// التحقق مما إذا كانت الرسالة إعلانًا
function isAdMessage(message) {
    const { blacklist, whitelist } = loadAdKeywords();

    if (whitelist.some(word => message.body.includes(word))) {
        return false; // ليست إعلانًا
    }

    const words = message.body.toLowerCase().split(/\s+/);
    const containsBlacklistedWord = words.some(word => blacklist.includes(word));
    const hasNumber = /\d{9,}/.test(message.body);
    const isLongMessage = words.length > 30;

    return containsBlacklistedWord && (hasNumber || isLongMessage);
}

// التعامل مع الإعلانات
export async function handleAdMessage(message, messageMeta, chat) {
    if (!messageMeta.isGroup) return;

    if (isAdMessage(message)) {
        try {
            const senderId = message.author || message.from;
            const senderName = messageMeta.pushname || messageMeta.number;
            const botId = client.info.wid._serialized;

            const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            if (!botParticipant || !botParticipant.isAdmin) return;

            const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
            if (senderParticipant && senderParticipant.isAdmin) return; // لا نحذف رسائل المشرفين

            await message.delete(true).catch(() => { });

            await chat.sendMessage(`⚠️ *تنبيه: ${senderName}، نشر الإعلانات ممنوع في هذه المجموعة. تم حذف رسالتك!*`);

        } catch (error) {
            logger.error('Error handling ad message:', error);
        }
    }
}