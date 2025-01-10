import dotenv from 'dotenv';
dotenv.config();
import path from "node:path";
export const root = path.resolve(process.cwd()); // project root directory (./)

export const config = {

  botPhoneNumber: process.env.BOT_PHONE_NUMBER, // رقم البوت مثل (966553******)
  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER, // رقم المشرف مثل (966553556010)
  defaultAuthor: process.env.DEFAULT_AUTHOR, // مؤلف الملصق الأفتراضي
  defaultTitle: process.env.DEFAULT_TITLE, // عنوان الملصق الأفتراضي
  sendWelcomeFarewellMessages: true, // لتفعيل رسائل الانظام والمغادرة للقروبات

  /* Config Database */
  DatabasePath: process.env.DATABASE_PATH || path.join(root, "src", "database", "database.sqlite"),

  /* Paths */
  paths: {
    root: root,
    logs: path.join(root, "src", "logs"),
    filterConfig: path.join(root, "filterConfig.json"), // ملف الانماط لتصفيةاللإعلانات من القروب
    badwords: path.join(root, "badwords.txt"), // ملف الكلمات المسيئة لتصفيتها من القروب
  },
};