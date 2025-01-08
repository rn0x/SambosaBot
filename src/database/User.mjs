import { sequelize, DataTypes } from './db.mjs';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user',  // تعيين الدور الافتراضي للمستخدم
    },
    textMessagesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,  // عدد الرسائل النصية
    },
    imagesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,  // عدد الصور
    },
    videosCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,  // عدد الفيديوهات
    },
    stickersCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,  // عدد الملصقات
    },
    stickerRights: {
        type: DataTypes.TEXT,  // تخزين البيانات بتنسيق نصي (JSON)
        defaultValue: JSON.stringify({
            creator: 'ضع حقوقك هنا',  // القيمة الافتراضية لـ creator
            title: 'عالم الملصقات 🌍'   // القيمة الافتراضية لـ title
        }),
    },
});

export default User;