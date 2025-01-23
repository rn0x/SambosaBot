import fs from 'fs';
import path from 'path';
import { config } from '../../config.mjs'

class Logger {
  constructor(logDir) {
    this.logDir = logDir;

    // تأكد من وجود المجلد
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // تحديد ملفات السجلات
    this.files = {
      error: path.join(logDir, 'errors.log'),
      info: path.join(logDir, 'info.log'),
      warning: path.join(logDir, 'warnings.log'),
    };
  }

  // تسجيل رسالة في ملف محدد
  log(type, message) {
    const filePath = this.files[type];
    if (!filePath) {
      throw new Error(`❌ Invalid log type: ${type}`);
    }

    const logMessage = `[${new Date().toISOString()}] ${type.toUpperCase()}: ${message}\n`;

    // كتابة الرسالة إلى الملف
    fs.appendFile(filePath, logMessage, (err) => {
      if (err) {
        console.error(`❌ Failed to write to ${type} log`, err);
      }
    });
  }

  // تسجيل الأخطاء مع تفاصيل الخطأ (مثل المكدس)
  error(message, err = null) {
    const errorMessage = err ? `${message} - ${err.message}\nStack: ${err.stack}` : message;
    this.log('error', errorMessage);
  }

  // تسجيل التحذيرات
  warning(message) {
    this.log('warning', message);
  }

  // تسجيل المعلومات
  info(message) {
    this.log('info', message);
  }
}

const logger = new Logger(config.paths.logs);
export default logger;