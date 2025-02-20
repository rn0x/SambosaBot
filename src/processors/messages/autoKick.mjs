// /processors/messages/autoKick.mjs

import logger from '../../utils/logger.mjs';
import client from '../../client.mjs';

export async function autoKick(message, messageMeta, chat) {
    try {

        // التحقق مما إذا كانت الرسالة تحتوي على رابط أو رقم هاتف
        const linkPattern = /(https?:\/\/[^\s]+)/g;
        const phonePattern = /(\+?[0-9]{10,15})/g;
        if (!linkPattern.test(message.body) && !phonePattern.test(message.body)) return;

        // التأكد من أن الرسالة من قروب
        if (!messageMeta.isGroup) return;

        // الحصول على رقم المرسل
        const senderId = message.author || message.from;

        // التحقق من أن البوت نفسه مشرف
        const botId = client.info.wid._serialized;
        const botParticipant = chat.participants.find(
            (participant) => participant.id._serialized === botId
        );
        if (!botParticipant || !botParticipant.isAdmin) {
            logger.info("البوت ليس مشرفًا، لذا لا يمكنه حذف الأعضاء.");
            return;
        }

        // التحقق مما إذا كان المرسل مشرفًا
        const senderParticipant = chat.participants.find(
            (participant) => participant.id._serialized === senderId
        );
        if (senderParticipant && senderParticipant.isAdmin) return; // لا تقم بطرد المشرفين


        
        // حذف رسالة المرسل (اختياري)
        await message.delete(true).catch(() => { });
        // إرسال رسالة توضيحية للعضو
        await chat.sendMessage(`🚫 تم طردك من القروب بسبب مخالفة القوانين وإرسال روابط أو أرقام هواتف.`);
        // طرد العضو من القروب
        await chat.removeParticipants([senderId]).catch(() => { });
        return 
    } catch (error) {
        logger.error('Error in autoKick:', error);
    }
}
