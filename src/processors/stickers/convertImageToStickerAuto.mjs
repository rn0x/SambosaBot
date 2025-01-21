import { config } from '../../../config.mjs'

export async function convertImageToStickerAuto(message, MessageMedia, messageMeta) {
    try {

        if (!message.hasMedia) return
        if (message?.type !== 'image') return

        const media = await message.downloadMedia();
        if (media.mimetype !== 'image/jpeg') return

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const processedMedia = new MessageMedia('image/png', media.data, `${uniqueId}.png`);
        // إرسال الصورة المعدلة
        // await client.sendMessage(message.from, processedMedia, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });
        await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: config.defaultAuthor, stickerName: messageMeta.pushname || messageMeta.number });
        await message.reply("✨ *تم تحويل الصورة إلى ملصق بنجاح!* ✨\n📤 تم إرسال الملصق إليك!");
    } catch (error) {
        console.error('Error converting image to sticker:', error);
        await message.reply(`Error converting image to sticker: ${error}`);
        throw error;
    }
}
