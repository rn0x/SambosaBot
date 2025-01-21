import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';

export async function convertImageToSticker(message, MessageMedia, messageMeta) {
    try {


        const hasQuotedMsg = message.hasQuotedMsg;
        if (!hasQuotedMsg) return
        const keywords = ["!ملصق", "!استكر", "!sticker", '!stk'];
        if (!hasMatchingKeywords(message.body, keywords)) return
        const getQuotedMessage = await message.getQuotedMessage();

        if (!getQuotedMessage.hasMedia) return
        if (getQuotedMessage?.type !== 'image') return

        const media = await getQuotedMessage.downloadMedia();
        if (media.mimetype !== 'image/jpeg') return

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const processedMedia = new MessageMedia('image/png', media.data, `${uniqueId}.png`);
        // إرسال الصورة المعدلة
        // await client.sendMessage(message.from, processedMedia, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });
        await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: messageMeta.pushname || messageMeta.number, stickerName: config.stickerName });
        await message.reply("✨ *تم تحويل الصورة إلى ملصق بنجاح!* ✨\n📤 تم إرسال الملصق إليك!");
    } catch (error) {
        console.error('Error converting image to sticker:', error);
        await message.reply(`Error converting image to sticker: ${error}`);
        throw error;
    }
}
