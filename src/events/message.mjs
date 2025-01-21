// /events/message.mjs

import client, { MessageMedia, Poll } from '../client.mjs';
import path from 'path';
import fs from 'fs-extra';
import { config } from '../../config.mjs';
import { convertImageToStickerBg } from '../processors/stickers/convertImageToStickerBg.mjs';
import { stealSticker } from '../processors/stickers/stealSticker.mjs';
import { convertVideoToStickerAuto } from '../processors/stickers/convertVideoToStickerAuto.mjs';
import { convertImageToStickerAuto } from '../processors/stickers/convertImageToStickerAuto.mjs';
import { convertImageToSticker } from '../processors/stickers/convertImageToSticker.mjs';
import { convertVideoToSticker } from '../processors/stickers/convertVideoToSticker.mjs';
import { convertStickerToMedia } from '../processors/stickers/convertStickerToMedia.mjs';
import { sendMenu } from '../processors/messages/sendMenu.mjs';
import { handleSpam } from '../processors/spamHandler.mjs';
import { convertImageToStickerCircle } from '../processors/stickers/convertImageToStickerCircle.mjs';
import IslamicQuiz from '../processors/IslamicQuiz.mjs';
import checkAnswer from '../processors/checkAnswer.mjs';

export default function message() {
    client.on('message', async (message) => {
        try {
            const groupIDs = config.allowedGroups;
            const getChat = await message.getChat();
            const getContact = await message.getContact();

            // تجميع المعلومات في كائن واحد
            const messageMeta = {
                pushname: getContact.pushname || message._data.notifyName,
                userid: getContact.id._serialized,
                number: getContact.number,
                id: message.from,
                isForwarded: message.isForwarded,
                deviceType: message.deviceType,
                isGroup: message.from.includes('@g.us'),
                chatName: getChat.name,
            };

            // التعامل مع السبام
            await handleSpam(message, messageMeta);

            // نلقائي يعمل في قروبات معينة فقط
            // messageMeta.isGroup && groupIDs.includes(messageMeta.id) - ميزة في المستقبل | السماح لقروبات معينة فقط
            if (messageMeta.isGroup) {
                await convertImageToStickerAuto(message, MessageMedia, messageMeta);
                await convertVideoToStickerAuto(message, MessageMedia, messageMeta);
            }

            // جميع المعالجات أو الأوامر
            await convertImageToSticker(message, MessageMedia, messageMeta);
            await convertImageToStickerCircle(message, MessageMedia, messageMeta);
            await convertImageToStickerBg(message, MessageMedia, messageMeta);
            await convertVideoToSticker(message, MessageMedia, messageMeta);
            await stealSticker(message, MessageMedia, messageMeta);
            await convertStickerToMedia(message, MessageMedia);
            await sendMenu(message, messageMeta);
            await IslamicQuiz(message, Poll);
            await checkAnswer(message);

            // await message.reply(new Poll('Winter or Summer?', ['Winter', 'Summer']));

        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
}