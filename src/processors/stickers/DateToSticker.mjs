import { config } from "../../../config.mjs";
import { createDateSticker } from "../../utils/dateSticker.mjs";
import hasMatchingKeywords from "../../utils/hasMatchingKeywords.mjs";
import logger from "../../utils/logger.mjs";


export default async function DateToSticker(message, MessageMedia) {
    try {
        const keywords = ["!تاريخ", "!التاريخ", "!date"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        const base64Image = await createDateSticker();

        if (base64Image) {
            const media = new MessageMedia('image/png', base64Image, 'date-sticker.png');

            await message.reply(media, null, {
                sendMediaAsSticker: true,
                stickerAuthor: 'تاريخ اليوم',
                stickerName: config.stickerName,
                stickerCategories: ['✨', '❤️']
            });
        }

    } catch (error) {
        logger.error('فشل في إنشاء ملصق التاريخ:', error);
    }
}