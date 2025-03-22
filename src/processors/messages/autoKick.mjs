import fs from 'fs-extra';
import path from "node:path";
import logger from '../../utils/logger.mjs';
import client from '../../client.mjs';
import { config } from '../../../config.mjs';

// ملف حفظ بيانات المخالفات
const DATA_FILE = path.join(config.paths.data, '/violations.json');
const DATA_DIR = path.dirname(DATA_FILE);
const WARNING_LIMIT = 2; // عدد المرات التي يُسمح بها قبل الطرد

// التأكد من وجود المجلد والملف
function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeJsonSync(DATA_FILE, {});
        }
    } catch (error) {
        logger.error('Error ensuring data file:', error);
    }
}

// تحميل البيانات من ملف JSON
function loadViolations() {
    ensureDataFile();
    try {
        return fs.readJsonSync(DATA_FILE, { throws: false }) || {};
    } catch (error) {
        logger.error('Error loading violations data:', error);
        return {};
    }
}

// حفظ البيانات في ملف JSON
function saveViolations(data) {
    ensureDataFile();
    try {
        fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
    } catch (error) {
        logger.error('Error saving violations data:', error);
    }
}

export async function autoKick(message, messageMeta, chat) {
    try {
        const linkPattern = /(https?:\/\/[^\s]+)/g;
        if (!linkPattern.test(message.body)) return;
        if (!messageMeta.isGroup) return;

        const senderId = message.author || message.from;
        const senderName = messageMeta.pushname || messageMeta.number;
        const botId = client.info.wid._serialized;
        const botParticipant = chat.participants.find(p => p.id._serialized === botId);
        if (!botParticipant || !botParticipant.isAdmin) return;

        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (senderParticipant && senderParticipant.isAdmin) return;

        let violations = loadViolations();
        const chatId = chat.id._serialized;
        if (!violations[chatId]) violations[chatId] = {};
        if (!violations[chatId][senderId]) violations[chatId][senderId] = 0;

        violations[chatId][senderId]++;
        saveViolations(violations);

        const remainingWarnings = WARNING_LIMIT - violations[chatId][senderId] + 1;
        
        if (violations[chatId][senderId] > WARNING_LIMIT) {
            await chat.sendMessage(`🚫 عذرًا ${senderName}، تم إنهاء مشاركتك في المجموعة بسبب إرسال الروابط بشكل متكرر. نتمنى لك التوفيق.`);
            await chat.removeParticipants([senderId]).catch(() => {});
            violations[chatId][senderId] = 0; // تصفير عدد المخالفات بعد الإزالة
            saveViolations(violations);
        } else {
            await chat.sendMessage(`⚠️ تنبيه: ${senderName}، يُرجى الامتناع عن نشر الروابط في هذه المجموعة. لقد تم تسجيل مخالفتك رقم ${violations[chatId][senderId]}. لا يزال لديك ${remainingWarnings} تنبيه قبل اتخاذ إجراء بخصوص استمرارك في المجموعة.`);
        }

        await message.delete(true).catch(() => {});
    } catch (error) {
        logger.error('Error in autoKick:', error);
    }
}