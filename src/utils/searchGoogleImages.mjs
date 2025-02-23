import puppeteer from "puppeteer";
import { config } from "../../config.mjs";

/**
 * يبحث في صور Google ويعيد قائمة بروابط الصور.
 * @param {string} query - مصطلح البحث عن الصور.
 * @returns {Promise<string[]>} قائمة بأول 10 روابط صور.
 * @throws {Error} إذا حدث خطأ أثناء البحث.
 */
export default async function searchGoogleImages(query) {
  const browser = await puppeteer.launch({
    headless: "new", args: ["--no-sandbox"], executablePath: config.PuppeteerPath,
  });
  const page = await browser.newPage();

  try {
    // إضافة User-Agent لمنع الحظر
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    // استخراج الروابط باستخدام regex
    const html = await page.content();
    const pattern =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*(jpg|jpeg))/g;

    let images = html.match(pattern);

    // إذا لم يجد أي نتائج، نستخدم `querySelectorAll`
    if (!images || images.length === 0) {
      images = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .map((img) => img.src)
          .filter((src) => src.startsWith("http"))
      );
    }

    return images?.filter(Boolean).slice(0, 10); // إرجاع أول 10 صور بدون القيم الفارغة
  } catch (error) {
    throw error;
  } finally {
    await browser.close(); // ضمان إغلاق المتصفح في جميع الحالات
  }
}