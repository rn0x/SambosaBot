import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { config } from '../../config.mjs'

// تحميل المتغيرات البيئية
dotenv.config();

// تحديد مسار قاعدة البيانات
const databasePath = config.DatabasePath;
const resolvedPath = path.resolve(config.paths.root, databasePath);

// التأكد من أن المجلد موجود، وإذا لم يكن موجودًا يتم إنشاؤه
const directory = path.dirname(resolvedPath);
try {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`✅ Created directory: ${directory}`);
  }
} catch (err) {
  console.error('❌ Failed to create directory:', err);
  process.exit(1); // إنهاء العملية إذا حدث خطأ
}

// إنشاء اتصال Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: resolvedPath,
  logging: false, // تعطيل اللوق
  // logging: (msg) => {
  //   console.log(`[Sequelize] ${msg}`);
  // },
});

export { sequelize, DataTypes };