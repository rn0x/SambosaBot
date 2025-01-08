import { User } from '../database/index.mjs';
import { config } from '../../config.mjs'

/**
 * تعيين اسم المؤلف للملصق
 * @param {string} phone - رقم الهاتف.
 * @param {string} author - اسم المؤلف.
 */
export const setStickerAuthor = async (phone, author) => {
    try {
        // التحقق إذا كان المؤلف فارغًا
        if (!author) {
            return 'The author name cannot be empty.';
        }

        // البحث عن المستخدم بناءً على رقم الهاتف
        const user = await User.findOne({ where: { phone } });

        if (user) {
            // إذا لم يكن هناك حقوق ملصق، نقوم بإنشائها بشكل افتراضي
            const stickerRights = user.stickerRights ? JSON.parse(user.stickerRights) : {};

            // تعيين اسم المؤلف
            stickerRights.creator = author;

            // تحديث حقوق الملصق في قاعدة البيانات
            await user.update({
                stickerRights: JSON.stringify(stickerRights),
            });

            console.log('Sticker author updated for user', phone);
            return `Sticker author successfully updated to: ${author}`;
        } else {
            return 'User not found.';
        }
    } catch (error) {
        console.error('Error updating sticker author:', error);
        return 'An error occurred while updating the author.';
    }
};

/**
 * تعيين عنوان الملصق
 * @param {string} phone - رقم الهاتف.
 * @param {string} title - عنوان الملصق.
 */
export const setStickerTitle = async (phone, title) => {
    try {
        // التحقق إذا كان العنوان فارغًا
        if (!title) {
            return 'The title cannot be empty.';
        }

        // البحث عن المستخدم بناءً على رقم الهاتف
        const user = await User.findOne({ where: { phone } });

        if (user) {
            // إذا لم يكن هناك حقوق ملصق، نقوم بإنشائها بشكل افتراضي
            const stickerRights = user.stickerRights ? JSON.parse(user.stickerRights) : {};

            // تعيين عنوان الملصق
            stickerRights.title = title;

            // تحديث حقوق الملصق في قاعدة البيانات
            await user.update({
                stickerRights: JSON.stringify(stickerRights),
            });

            console.log('Sticker title updated for user', phone);
            return `Sticker title successfully updated to: ${title}`;
        } else {
            return 'User not found.';
        }
    } catch (error) {
        console.error('Error updating sticker title:', error);
        return 'An error occurred while updating the title.';
    }
};


/**
 * استرجاع حقوق الملصق
 * @param {string} phone - رقم الهاتف.
 */
export const getStickerRights = async (phone) => {
    try {
        // البحث عن المستخدم بناءً على رقم الهاتف
        const user = await User.findOne({ where: { phone } });

        if (user) {
            // استرجاع حقوق الملصق
            const stickerRights = user.stickerRights ? JSON.parse(user.stickerRights) : {};

            // تعيين قيم افتراضية إذا كانت الحقوق غير موجودة
            const author = stickerRights.creator || config.defaultAuthor;
            const title = stickerRights.title || config.defaultTitle;

            return { author, title };
        } else {
            console.log('User not found');
            return { author: config.defaultAuthor, title: config.defaultTitle };
        }
    } catch (error) {
        console.error('Error fetching sticker rights:', error);
        return { author: config.defaultAuthor, title: config.defaultTitle };
    }
};