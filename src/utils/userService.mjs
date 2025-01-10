import { User } from '../database/index.mjs';
import { config } from '../../config.mjs'

/**
 * دالة لتحديث أو إضافة بيانات المستخدم.
 * @param {string} phone - رقم هاتف المستخدم.
 * @param {string} eventType - نوع الحدث (رسالة، صورة، فيديو، إلخ).
 */
export const updateUserStats = async (phone, eventType, name = '') => {
    try {
        // البحث عن المستخدم بناءً على رقم الهاتف
        let user = await User.findOne({ where: { phone } });

        // إذا لم يكن المستخدم موجودًا، نقوم بإنشائه
        if (!user) {
            // تحديد الدور بناءً على الرقم
            const role = phone.includes(config.adminPhoneNumber) ? 'admin' : 'user';

            // إذا كان الاسم غير فارغ، نضيفه
            user = await User.create({
                phone,
                name,
                role,
            });
        }

        // تحديث البيانات بناءً على نوع الحدث
        switch (eventType) {
            case 'text':
                await User.increment('textMessagesCount', { by: 1, where: { phone } });
                break;
            case 'image':
                await User.increment('imagesCount', { by: 1, where: { phone } });
                break;
            case 'video':
                await User.increment('videosCount', { by: 1, where: { phone } });
                break;
            case 'sticker':
                await User.increment('stickersCount', { by: 1, where: { phone } });
                break;
            default:
                console.error('Unknown event type');
        }

        console.log(`User data updated for ${phone}`);
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
};


/**
 * استرجاع إحصائيات المستخدم
 * @param {number} userId - معرف المستخدم.
 * @returns {Promise<Object|null>} - إرجاع معلومات المستخدم أو null إذا لم يتم العثور عليه.
 */
export async function getUserStats(userId) {
    try {
        const user = await User.findOne({ where: { phone: userId } });
        if (user) {
            return {
                name: user.name,
                textMessagesCount: user.textMessagesCount,
                imagesCount: user.imagesCount,
                videosCount: user.videosCount,
                stickersCount: user.stickersCount,
            };
        }
        return null; // في حال لم يوجد المستخدم
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return null;
    }
}

/**
 * إرسال معلومات المستخدم
 * @param {number} userId - معرف المستخدم.
 * @param {Object} message - الكائن الذي يحتوي على الرسالة.
 */
export async function sendUserInfo(userId, message) {
    const stats = await getUserStats(userId);
    if (stats) {
        const infoMessage = `📊 *معلوماتك الشخصية*\n\n` +
            `*الاسم:* ${stats.name}\n` +
            `*عدد الرسائل النصية:* ${stats.textMessagesCount}\n` +
            `*عدد الصور:* ${stats.imagesCount}\n` +
            `*عدد الفيديوهات:* ${stats.videosCount}\n` +
            `*عدد الملصقات:* ${stats.stickersCount}\n`;
        // هنا تقوم بإرسال الرسالة إلى المستخدم
        await message.reply(infoMessage);
    } else {
        await message.reply('لم نتمكن من العثور على معلوماتك.');
    }
}