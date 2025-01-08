import dotenv from 'dotenv';
dotenv.config();
import whatsappWeb from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = whatsappWeb;
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs-extra';
import { config } from '../config.mjs'
import { setStickerAuthor, setStickerTitle, getStickerRights } from './utils/stickerRights.mjs'
import { convertVideoToWebp } from './utils/convertToWebp.mjs';
import { updateUserStats } from './utils/userService.mjs'

// إعداد متغيرات البيئة
const MAX_RETRIES = process.env.MAX_RETRIES || 5;  // الحد الأقصى لعدد المحاولات لإعادة الاتصال
const RETRY_DELAY = process.env.RETRY_DELAY || 5000;  // التأخير بين المحاولات بالمللي ثانية
let retryCount = 0;

// تهيئة عميل WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",             // تعطيل الـ sandbox لتعزيز الاستقرار
            "--disable-setuid-sandbox", // تعطيل بعض المميزات الخاصة بـ sandbox
            "--disable-dev-shm-usage",  // تعطيل استخدام الذاكرة المشتركة
        ],
        timeout: 60000,
        executablePath: process.env.EXECUTABLE_PATH || undefined,
    }
});

client.on('qr', (qr) => {
    // توليد الكود QR وقم بمسحه باستخدام هاتفك
    qrcode.generate(qr, { small: true });
});


client.on('loading_screen', (percent, message) => {
    console.log('Loading screen', percent, message);
});

client.on('authenticated', () => {
    console.log('Authenticated');
});

client.on('auth_failure', (e) => {
    // يتم استدعاؤه إذا فشل استعادة الجلسة
    console.error('Authentication failure', e);
});


client.on('message', async (message) => {
    try {
        if (message?.from === 'status@broadcast') return;

        const chat = await message?.getChat().catch(error => console.log(error));
        const contact = await message?.getContact().catch(error => console.log(error));
        const userId = message?.author ? message.author : message.from;
        const type = message?.type || '';
        const isGroup = chat?.isGroup;
        const userName = isGroup ? chat?.name : contact?.pushname;
        const number = isGroup ? chat?.id?.user : contact?.number ? contact?.number : contact?.id?.user;
        const timestamp = Date.now(); // الحصول على الطابع الزمني الحالي

        // إذا كانت الرسالة من نوع 'chat' قم بحذفها

        if (message.hasMedia) {
            const media = await message.downloadMedia();
            const data = media.data;
            const dataBase64 = Buffer.from(media.data, 'base64');
            const tempDir = './temp'; // مسار مؤقت لتخزين الملفات
            const mimetype = media.mimetype;

            const { author, title } = await getStickerRights(userId);

            if (mimetype === 'image/webp' && type === 'sticker') {

                await updateUserStats(userId, 'sticker', userName);
                const sticker = new MessageMedia('image/webp', data, `${timestamp}.webp`);
                await message.reply(sticker, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

            } else if (mimetype === 'image/jpeg' && type === 'image') {

                await updateUserStats(userId, 'image', userName);
                const image = new MessageMedia('image/jpeg', data, `${timestamp}.jpg`);
                await message.reply(image, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

            } else if (mimetype === 'image/jpeg' && type === 'document') {

                await updateUserStats(userId, 'image', userName);
                const image = new MessageMedia('image/jpeg', data, `${timestamp}.jpg`);
                await message.reply(image, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

            } else if (mimetype === 'image/png' && type === 'document') {
                await updateUserStats(userId, 'image', userName);
                const image = new MessageMedia('image/png', data, `${timestamp}.png`);
                await message.reply(image, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

            } else if (mimetype === 'video/mp4' && message.type === 'video') {

                await updateUserStats(userId, 'video', userName);
                const inputPath = path.join(tempDir, `${timestamp}.mp4`);
                const outputDir = tempDir;

                // إنشاء ملف مؤقت للفيديو باستخدام fs-extra
                await fs.ensureDir(tempDir);
                await fs.writeFile(inputPath, dataBase64);

                // تحويل الفيديو إلى WebP
                const webpPath = await convertVideoToWebp(inputPath, outputDir);

                if (webpPath.success) {
                    // قراءة ملف WebP كـ Base64 وإرساله كملصق
                    const webpData = await fs.readFile(webpPath.outputPath, { encoding: 'base64' }).catch(() => { });
                    const sticker = new MessageMedia('image/webp', webpData, 'sticker.webp');
                    await message.reply(sticker, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

                    // تنظيف الملفات المؤقتة باستخدام fs-extra
                    await fs.remove(inputPath);
                    await fs.remove(webpPath.outputPath);
                } else {
                    message.reply(webpPath.error);
                    console.error('Conversion failed:', webpPath.error);
                }
            } else {
                await message.delete(true);
                return;
            }
        } else if (type === 'chat') {

            await updateUserStats(userId, 'text', userName);
            const text = message.body?.trim();

            // حالة الأمر لتعيين المؤلف
            if (text.startsWith('/setAuthor ')) {
                const author = text.replace('/setAuthor ', '').trim();
                const response = await setStickerAuthor(userId, author);
                await message.reply(response);  // إرجاع رد الوظيفة
            }

            // حالة الأمر لتعيين العنوان
            if (text.startsWith('/setTitle ')) {
                const title = text.replace('/setTitle ', '').trim();
                const response = await setStickerTitle(userId, title);
                await message.reply(response);  // إرجاع رد الوظيفة
            }

            // استرجاع حقوق الملصق
            if (text === '/stickerRights') {
                const { author, title } = await getStickerRights(userId);
                await message.reply(`Sticker Rights: Author - ${author}, Title - ${title}`);
            }

            // إضافة أمر /start
            if (text === '/start') {
                const startMessage = `
🌟 مرحباً بك ${userName} في بوت عالم الملصقات! 🌟

🚀 طريقة استعمال البوت:

1️⃣ /setAuthor [اسم المؤلف]: لتعيين المؤلف للملصقات.  
2️⃣ /setTitle [عنوان الملصق]: لتعيين عنوان الملصق.  
3️⃣ /stickerRights: لاسترجاع حقوق الملصق (المؤلف والعنوان).  
4️⃣ /start: لعرض هذه التعليمات مرة أخرى.  

🔧 ملاحظات:
- فقط قم بإرسال صورة او فيديو او ملصق لتحويلها الى ملصق
- لا تتردد في إرسال أي استفسار! 📩

📱 استمتع! 😊
                `;
                await message.reply(startMessage);
            }

            else {
                if (!userId.includes(config.adminPhoneNumber)) {
                    await message.delete(true);
                    console.log('Message deleted');
                    return; // الخروج من دالة المعالجة بعد الحذف
                }

            }
        }

    } catch (error) {
        console.error('Error while processing message:', error);
    }
});

client.on('group_join', async (e) => {
    try {
        // console.log('Group join event:', e);

        const userId = e.id?.participant;
        const chat = await client.getChatById(userId);
        const welcomeMessage = `مرحباً ${chat.name}! أهلاً بك في المجموعة. نتمنى لك وقتاً ممتعاً هنا!`;
        await client.sendMessage(e.chatId, welcomeMessage);
    } catch (error) {
        console.error('Error while processing group join:', error);
    }
});

client.on('group_leave', async (e) => {
    try {
        // console.log('Group leave event:', e);
        const userId = e.id?.participant;
        const chat = await client.getChatById(userId);
        // إرسال رسالة وداع عند مغادرة عضو
        const farewellMessage = `وداعاً ${chat.name}. نأمل أن نراك مرة أخرى في المستقبل!`;

        // إرسال الرسالة إلى المجموعة
        await client.sendMessage(e.chatId, farewellMessage);

    } catch (error) {
        console.error('Error while sending farewell message:', error);
    }
});

client.on('change_state', (state) => {
    console.log('State change:', state);
});

client.on('disconnected', async (reason) => {
    try {
        console.log('WhatsApp Bot was logged out', reason);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Attempting to reconnect... (Attempt ${retryCount} of ${MAX_RETRIES})`);
            setTimeout(() => {
                client.initialize(); // إعادة تهيئة العميل بعد التأخير
            }, RETRY_DELAY);
        } else {
            console.error('Max retry attempts reached. Please check your connection or credentials.');
        }
    } catch (error) {
        console.error('Error during reconnection:', error);
    }
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

client.initialize();