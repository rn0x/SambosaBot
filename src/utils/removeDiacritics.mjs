// دالة لإزالة التشكيل من النصوص العربية
export default function removeDiacritics(text) {
    return text.normalize('NFKD').replace(/[\u064B-\u065F\u0617-\u061A\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '');
}