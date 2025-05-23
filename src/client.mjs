// /client.mjs

import dotenv from 'dotenv';
dotenv.config();
import whatsappWeb from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, Poll } = whatsappWeb;
import { config } from '../config.mjs'


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
        executablePath: config.PuppeteerPath || undefined,
    }
});

export default client;
export {
    MessageMedia,
    Poll
}