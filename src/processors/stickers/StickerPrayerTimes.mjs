import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import { createPrayerTimeSticker } from '../../utils/prayerTimes.mjs';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';

export default async function StickerPrayerTimes(message, MessageMedia) {
    try {
        const keywords = ["!صلاة", "!صلاه", "!prayer"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        const base64Image = await createPrayerTimeSticker();

        if (base64Image) {
            const media = new MessageMedia('image/png', base64Image, 'prayer-time.png');

            await message.reply(media, null, {
                sendMediaAsSticker: true,
                stickerAuthor: 'الصلاة القادمة',
                stickerName: config.stickerName,
                stickerCategories: ['✨', '❤️']
            });
        }

    } catch (error) {
        logger.error('فشل في إنشاء ملصق الصلاة:', error);
    }
}