// /processors/spamHandler.mjs

const usersLastMessageTime = {}; // لتخزين وقت آخر رسالة لكل مستخدم
const usersMessageCount = {}; // لتخزين عدد الرسائل لكل مستخدم في فترة زمنية قصيرة
const usersLastSpamAlertTime = {}; // لتخزين وقت آخر تنبيه سبام للمستخدم
const MESSAGE_DELAY = 5000; // الفترة الزمنية بين الرسائل (مثلاً 5 ثواني)
const MAX_MESSAGES = 10; // الحد الأقصى للرسائل المسموح بها في الفترة الزمنية
const SPAM_WAIT_TIME = 120000; // وقت الانتظار (2 دقيقة) بعد تنبيه السبام في المحادثات الخاصة
const CLEANUP_INTERVAL = 3600000; // مدة التنظيف (مثلاً كل ساعة)

// دالة لفحص السبام وتنبيه المستخدم
export async function handleSpam(message, messageMeta) {
    if (!messageMeta.isGroup) {
        if (usersMessageCount[messageMeta.userid]) {
            const timeDifference = Date.now() - usersLastMessageTime[messageMeta.userid];
            if (timeDifference < MESSAGE_DELAY) {
                usersMessageCount[messageMeta.userid]++;
                // إذا أرسل المستخدم أكثر من الحد المسموح به من الرسائل في فترة قصيرة
                if (usersMessageCount[messageMeta.userid] > MAX_MESSAGES) {
                    // التحقق إذا كان قد تم التنبيه سابقاً
                    const lastAlertTime = usersLastSpamAlertTime[messageMeta.userid];
                    if (!lastAlertTime || (Date.now() - lastAlertTime) > SPAM_WAIT_TIME) {
                        await message.reply('لقد أرسلت عدد كبير من الرسائل في وقت قصير. من فضلك انتظر قليلاً.');
                        // تحديث وقت آخر تنبيه سبام للمستخدم
                        usersLastSpamAlertTime[messageMeta.userid] = Date.now();
                    }
                }
            } else {
                // إذا مر وقت طويل بين الرسائل، إعادة تعيين العد
                usersMessageCount[messageMeta.userid] = 1; // يبدأ العد من جديد
            }
        } else {
            usersMessageCount[messageMeta.userid] = 1; // أول رسالة للمستخدم
        }
        // تحديث وقت آخر رسالة للمستخدم
        usersLastMessageTime[messageMeta.userid] = Date.now();
    }
}

// دالة لتنظيف بيانات المستخدمين الذين لم يتفاعلوا منذ فترة طويلة
export function cleanupInactiveUsers() {
    const currentTime = Date.now();
    for (const userId in usersLastMessageTime) {
        if (currentTime - usersLastMessageTime[userId] > CLEANUP_INTERVAL) {
            delete usersLastMessageTime[userId];
            delete usersMessageCount[userId]; // إزالة عدد الرسائل عند التنظيف
            delete usersLastSpamAlertTime[userId]; // إزالة سجل التنبيه عند التنظيف
            console.log(`تمت إزالة المستخدم ${userId} من سجل الرسائل`);
        }
    }
}

// تشغيل التنظيف الدوري في نفس الملف
setInterval(cleanupInactiveUsers, CLEANUP_INTERVAL);