import { sequelize } from '../database/db.mjs';
import { User, Group } from '../database/index.mjs'; // استيراد النماذج التي تريد مزامنتها

(async () => {
    try {
        // مزامنة قاعدة البيانات
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized successfully');
        process.exit(0); // إنهاء العملية بعد المزامنة
    } catch (error) {
        console.error('❌ Database synchronization failed:', error);
        process.exit(1); // إنهاء العملية مع رمز خطأ
    }
})();
