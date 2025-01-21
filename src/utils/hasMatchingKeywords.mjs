/**
 * التحقق مما إذا كان النص يحتوي على واحدة من الكلمات المحددة
 * @param {string} text - النص المراد التحقق منه
 * @param {string[]} keywords - قائمة الكلمات المراد البحث عنها
 * @returns {boolean} - true إذا تم العثور على أي كلمة، false إذا لم يتم العثور على شيء
 */
export default function hasMatchingKeywords(text, keywords) {
    if (text.length === 0 || !text || !Array.isArray(keywords)) {
        return false
        // throw new Error('Invalid input: text should be a string and keywords should be an array.');
    }
    // تحويل النص إلى حروف صغيرة لتجنب مشاكل الحروف الكبيرة والصغيرة
    const lowerCaseText = text.toLowerCase();
    // التحقق من وجود أي كلمة في النص
    return keywords.some(keyword => lowerCaseText.includes(keyword.toLowerCase()));
}

/**
 
 // مثال على الاستخدام
const text = "مرحبًا، كيف يمكنني مساعدتك؟";
const keywords = ["مساعدة", "استفسار", "طلب"];

if (hasMatchingKeywords(text, keywords)) {
    console.log("النص يحتوي على إحدى الكلمات المطلوبة.");
} else {
    console.log("النص لا يحتوي على أي من الكلمات المطلوبة.");
}

 */