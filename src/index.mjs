import dotenv from 'dotenv';
dotenv.config();
import whatsappWeb from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = whatsappWeb;
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs-extra';
import { config } from '../config.mjs'
import { setStickerAuthor, setStickerTitle, getStickerRights } from './utils/stickerRights.mjs'
import { convertVideoToWebp, getVideoDuration } from './utils/ffmpeg.mjs';
import { sendUserInfo, updateUserStats } from './utils/userService.mjs'
import { loadFilterConfig, filterMessage } from './utils/adFilter.mjs';
import { checkForBadWords } from './utils/badWordsFilter.mjs';

// إعداد متغيرات البيئة
const MAX_RETRIES = process.env.MAX_RETRIES || 5;  // الحد الأقصى لعدد المحاولات لإعادة الاتصال
const RETRY_DELAY = process.env.RETRY_DELAY || 5000;  // التأخير بين المحاولات بالمللي ثانية
let retryCount = 0;

const filterConfig = await loadFilterConfig(config.paths.filterConfig);

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
        if (message?.fromMe) return;

        const chat = await message?.getChat().catch(error => console.log(error));
        const contact = await message?.getContact().catch(error => console.log(error));
        const userId = message?.author ? message.author : message.from;
        const type = message?.type || '';
        const isGroup = message.from.includes('@g.us');
        const isChannel = message.from.includes('@newsletter');
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

            if (mimetype === 'image/webp' && type === 'sticker' && !isGroup && !isChannel) {
                await updateUserStats(userId, 'sticker', userName);
                const sticker = new MessageMedia('image/webp', data, `${timestamp}.webp`);
                await message.reply(sticker, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });
            }

            if (!isGroup) return;
            else if (mimetype === 'image/jpeg' && type === 'image' || mimetype === 'image/jpeg' && type === 'document') {

                await updateUserStats(userId, 'image', userName);
                const image = new MessageMedia('image/jpeg', data, `${timestamp}.jpg`);
                await message.reply(image, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

            } else if (mimetype === 'image/png' && type === 'document') {
                await updateUserStats(userId, 'image', userName);
                const image = new MessageMedia('image/png', data, `${timestamp}.png`);
                await message.reply(image, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });
            } else if (mimetype === 'image/gif' && type === 'document') {
                await updateUserStats(userId, 'image', userName);
                // إنشاء ملف مؤقت للفيديو باستخدام fs-extra
                const inputPath = path.join(tempDir, `${timestamp}.gif`);
                const outputDir = tempDir;

                await fs.ensureDir(tempDir);
                await fs.writeFile(inputPath, dataBase64);

                // تحويل الفيديو إلى WebM
                const webmPath = await convertVideoToWebp(inputPath, outputDir);

                if (webmPath.success) {
                    // قراءة ملف WebM كـ Base64 وإرساله كملصق
                    const webmData = await fs.readFile(webmPath.outputPath, { encoding: 'base64' }).catch(() => { });
                    const sticker = new MessageMedia('image/webp', webmData, 'sticker.webp');
                    await message.reply(sticker, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

                    // تنظيف الملفات المؤقتة باستخدام fs-extra
                    await fs.remove(webmPath.outputPath);
                } else {
                    if (webmPath.error) {
                        message.reply(webmPath.error);
                        console.error('فشل التحويل:', webmPath.error);
                    }
                }

            } else if (mimetype === 'video/mp4' && message.type === 'video') {
                await updateUserStats(userId, 'video', userName);

                // إنشاء ملف مؤقت للفيديو باستخدام fs-extra
                const inputPath = path.join(tempDir, `${timestamp}.mp4`);
                const outputDir = tempDir;

                await fs.ensureDir(tempDir);
                await fs.writeFile(inputPath, dataBase64);

                // الحصول على مدة الفيديو
                const duration = await getVideoDuration(inputPath);

                // التحقق من أن مدة الفيديو أقل من 5 ثانية
                const MAX_DURATION = 5; // الحد الأقصى للمدة بالثواني
                if (duration > MAX_DURATION) {
                    await fs.remove(inputPath);
                    return await message.reply(`الفيديو طويل جداً! الحد الأقصى للمدة هو ${MAX_DURATION} ثانية.`);
                }

                // تحويل الفيديو إلى WebM
                const webmPath = await convertVideoToWebp(inputPath, outputDir);

                if (webmPath.success) {
                    // قراءة ملف WebM كـ Base64 وإرساله كملصق
                    const webmData = await fs.readFile(webmPath.outputPath, { encoding: 'base64' }).catch(() => { });
                    const sticker = new MessageMedia('image/webp', webmData, 'sticker.webp');
                    await message.reply(sticker, undefined, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });

                    // تنظيف الملفات المؤقتة باستخدام fs-extra
                    await fs.remove(webmPath.outputPath);
                } else {
                    if (webmPath.error) {
                        message.reply(webmPath.error);
                        console.error('فشل التحويل:', webmPath.error);
                    }
                }
            } else {
                // await message.delete(true);
                return;
            }
        } else if (type === 'chat') {

            await updateUserStats(userId, 'text', userName);
            const text = message.body?.trim();

            // حالة الأمر لتعيين المؤلف
            if (text.startsWith('/setAuthor ')) {
                const author = text.replace('/setAuthor ', '').trim();

                // تحديد الحد الأدنى والأقصى لطول النص
                const minLength = 3; // الحد الأدنى للطول
                const maxLength = 25; // الحد الأقصى للطول

                if (author.length < minLength) {
                    await message.reply(`❌ اسم المؤلف يجب أن يكون على الأقل ${minLength} أحرف.`);
                } else if (author.length > maxLength) {
                    await message.reply(`❌ اسم المؤلف يجب أن لا يتجاوز ${maxLength} أحرف.`);
                } else {
                    const response = await setStickerAuthor(userId, author);
                    await message.reply(response);  // إرجاع رد الوظيفة
                }
            }

            // حالة الأمر لتعيين العنوان
            if (text.startsWith('/setTitle ')) {
                const title = text.replace('/setTitle ', '').trim();

                // تحديد الحد الأدنى والأقصى لطول النص
                const minLength = 3; // الحد الأدنى للطول
                const maxLength = 25; // الحد الأقصى للطول

                if (title.length < minLength) {
                    await message.reply(`❌ العنوان يجب أن يكون على الأقل ${minLength} أحرف.`);
                } else if (title.length > maxLength) {
                    await message.reply(`❌ العنوان يجب أن لا يتجاوز ${maxLength} أحرف.`);
                } else {
                    const response = await setStickerTitle(userId, title);
                    await message.reply(response);  // إرجاع رد الوظيفة
                }
            }


            // استرجاع حقوق الملصق
            if (text === '/stickerRights') {
                const { author, title } = await getStickerRights(userId);
                await message.reply(`Sticker Rights: Author - ${author}, Title - ${title}`);
            }

            if (text === '/info') {
                await sendUserInfo(userId, message);
            }

            if (text === '/groups') {
                const groupsMessage = `
🌐 المجموعات والقنوات الخاصة بنا:

1️⃣ قروب واتساب: "عالم الملصقات"  
📱 انضم إلى قروب علم الملصقات على واتساب: https://chat.whatsapp.com/FynLLeFLt0rApy6SHJ6UGn

2️⃣ قناة واتساب: "حزم عالم الملصقات"  
📱 انضم إلى قناة حزم عالم الملصقات على واتساب: https://whatsapp.com/channel/0029Vb2Kret8PgsIIbLCQg1b

3️⃣ قناة تيليجرام: "i8xApp"  
📱 انضم إلى قناة i8xApp على تيليجرام: https://t.me/i8xApp

نتمنى لك وقتاً ممتعاً في المجموعات والقنوات! 🚀
    `;
                await message.reply(groupsMessage, undefined, { linkPreview: false });
            }


            // إضافة أمر /start
            if (text === '/start') {
                const startMessage = `
🌟 مرحباً بك *${userName}* في بوت عالم الملصقات! 🌟

🚀 طريقة استعمال البوت:

1️⃣ */setAuthor* [اسم المؤلف]: لتعيين المؤلف للملصقات.  
2️⃣ */setTitle* [عنوان الملصق]: لتعيين عنوان الملصق.  
3️⃣ */stickerRights:* لاسترجاع حقوق الملصق (المؤلف والعنوان). 
4️⃣ */info:* لعرض معلوماتك الشخصية والإحصائيات (مثل عدد الملصقات التي أرسلتها).   
5️⃣ */groups:* لعرض القنوات الخاصة بنا.  
5️⃣ */start:* لعرض هذه التعليمات مرة أخرى.  

🔧 ملاحظات:
- فقط قم بإرسال صورة او فيديو او ملصق لتحويلها الى ملصق
- يعمل في القروبات فقط (تواصل معي عبر تيليجرام @F93ii اذا اردت اضافة البوت) يجب ان يكون قروب ملصقات
- لا تتردد في إرسال أي استفسار! 📩

📱 استمتع! 😊
                `;
                await message.reply(startMessage);
            }

            else {

                const adminPhoneNumbers = [config.adminPhoneNumber, config.botPhoneNumber]; // أرقام المشرفين
                if (!adminPhoneNumbers.some(adminNumber => userId.includes(adminNumber))) {
                    const isAd = filterMessage(text, filterConfig);

                    if (isAd) {
                        await message.reply(`📢 الرسالة تحتوي على إعلان أو يُشتبه بأنها إعلان`)
                        await message.delete(true);
                        return; // الخروج من دالة المعالجة بعد الحذف
                    }
                    await checkForBadWords(text, message);
                }
            }
        }

    } catch (error) {
        console.error('Error while processing message:', error);
    }
});

client.on('group_join', async (e) => {
    try {

        if (!config.sendWelcomeFarewellMessages) {
            return;
        }

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

        if (!config.sendWelcomeFarewellMessages) {
            return;
        }
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