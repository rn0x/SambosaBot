// /events/groupJoin.mjs

import client from '../client.mjs';
import path from 'path';
import fs from 'fs-extra';
import { generateImageFromHtml } from '../utils/generateImage.mjs';
import { config } from '../../config.mjs'

export default function groupJoin(client, MessageMedia) {
    client.on('group_join', async (e) => {
        try {
            // جلب المعرف الخاص بالمشارك
            const participantId = e.id.participant;

            // جلب بيانات الشخص باستخدام المعرف
            const contact = await client.getContactById(participantId);

            // استخراج المعلومات مثل الاسم ورقم الهاتف
            const name = contact.pushname || contact.verifiedName || 'غير معروف';
            const phoneNumber = contact.number;
            const profilePictureUrl = await contact.getProfilePicUrl();

            // جلب معلومات القروب
            const groupId = e.id.remote;
            if (groupId !== '120363394798363466@g.us') return
            const chat = await client.getChatById(groupId);
            const groupName = chat.name;
            const group = await chat.getContact();
            const groupPictureUrl = await group.getProfilePicUrl();

            // إعداد صور العرض الافتراضية
            const defaultProfilePic = await fs.readFile(path.join(config.paths.root, 'src', 'template', 'defaultPic.jpg'), { encoding: 'base64' });
            const defaultGroupPic = await fs.readFile(path.join(config.paths.root, 'src', 'template', 'defaultPic.jpg'), { encoding: 'base64' });
            const fontCairo = await fs.readFile(path.join(config.paths.root, 'src', 'template', 'Cairo-Regular.ttf'), { encoding: 'base64' });

            // إذا لم تكن الصور متوفرة، استخدم الصور الافتراضية
            const userPicture = profilePictureUrl || `data:image/jpeg;base64,${defaultProfilePic}`;
            const groupPicture = groupPictureUrl || `data:image/jpeg;base64,${defaultGroupPic}`;
            const fontCairoBase64 = `data:font/ttf;base64,,${fontCairo}`;

            // قالب HTML للصورة
            const htmlTemplate = await fs.readFile(path.join(config.paths.root, 'src', 'template', 'groupJoinTemplate.html'), { encoding: 'utf-8' });

            // البيانات الديناميكية
            const data = {
                userPicture,
                groupPicture,
                name,
                phone: phoneNumber,
                groupName,
                groupId,
                fontCairoBase64
            };

            // توليد الصورة
            const base64Image = await generateImageFromHtml({ htmlTemplate, data, viewport: { width: 600, height: 500 } });

            // تحويل Base64 إلى MessageMedia
            const imageMessage = new MessageMedia(
                'image/png',
                base64Image,
                'welcome.png',
            );

            let welcomeMessage = `مرحباً بك يا *${data.name}* في *${data.groupName}* 🎉\n\n`;
            welcomeMessage += `📞 رقم الهاتف: *${data.phone}*\n`;
            welcomeMessage += `🆔 معرف القروب: *${data.groupId.replace(/@.*/, '')}*\n\n`;
            welcomeMessage += `*نتمنى لك وقتًا ممتعًا معنا!* 🌟`;


            // إرسال الرسالة مع الصورة
            const sentMessage = await client.sendMessage(groupId, imageMessage, {
                caption: welcomeMessage, // استخدام المتغير كتعليق
            });

            setTimeout(async () => {
                await sentMessage.delete(true).catch(() => { });
            }, 2 * 60 * 1000);

        } catch (error) {
            console.error('Error in group_join event:', error);
        }
    });
}
