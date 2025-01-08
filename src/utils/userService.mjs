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
