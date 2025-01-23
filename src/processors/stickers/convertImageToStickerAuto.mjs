import { config } from '../../../config.mjs'
import logger from '../../utils/logger.mjs'

export async function convertImageToStickerAuto(message, MessageMedia, messageMeta) {
    try {

        if (!message.hasMedia) return
        if (message?.type !== 'image' && message?.type !== 'document') return

        const media = await message.downloadMedia();
        if (media.mimetype !== 'image/jpeg' && media.mimetype !== 'image/png') return

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const processedMedia = new MessageMedia('image/png', media.data, `${uniqueId}.png`);
        // إرسال الصورة المعدلة
        // await client.sendMessage(message.from, processedMedia, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });
        await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: messageMeta.pushname || messageMeta.number, stickerName: config.stickerName });
        await message.reply("*تم تحويل الصورة إلى ملصق بنجاح!* 🎁");
    } catch (error) {
        logger.error('Error converting image to sticker:', error);
        // await message.reply(`Error converting image to sticker: ${error}`);
        throw error;
    }
}
