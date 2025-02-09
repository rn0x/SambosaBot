import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import { createPrayerTimeSticker } from '../../utils/prayerTimes.mjs';
import logger from '../../utils/logger.mjs';

export default async function StickerPrayerTimes(message, MessageMedia, messageMeta) {
    try {
        const keywords = ["!صلاة", "!صلاه", "!prayer"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        const base64Image = await createPrayerTimeSticker();

        if (base64Image) {
            const media = new MessageMedia('image/png', base64Image, 'prayer-time.png');

            await message.reply(media, null, {
                sendMediaAsSticker: true,
                stickerAuthor: messageMeta.pushname || messageMeta.number,
                stickerName: 'الصلاة القادمة',
                stickerCategories: ['✨', '❤️']
            });
        }

    } catch (error) {
        console.log(error);
        logger.error('فشل في إنشاء ملصق الصلاة:', error);
    }
}