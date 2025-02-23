import puppeteer from "puppeteer";
import { config } from "../../config.mjs";

/**
 * يبحث في صور Google ويعيد قائمة بروابط صور GIF فقط.
 * @param {string} query - مصطلح البحث عن الصور المتحركة.
 * @returns {Promise<string[]>} قائمة بأول 10 روابط صور GIF.
 * @throws {Error} إذا حدث خطأ أثناء البحث.
 */
export default async function searchGoogleGifs(query) {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"], executablePath: config.PuppeteerPath });
  const page = await browser.newPage();

  try {
    // إضافة User-Agent لمنع الحظر
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    // التوجه إلى بحث Google مع تصفية الصور المتحركة (GIF)
    const url = `https://www.google.com/search?tbm=isch&tbs=itp:animated&q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    // استخراج الروابط باستخدام regex لصور GIF فقط
    const html = await page.content();
    const pattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*\.gif)/g;

    let gifs = html.match(pattern);

    // إذا لم يجد أي نتائج، نستخدم `querySelectorAll`
    if (!gifs || gifs.length === 0) {
      gifs = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .map((img) => img.src)
          .filter((src) => src.startsWith("http") && src.endsWith(".gif"))
      );
    }

    return gifs?.filter(Boolean).slice(0, 10); // إرجاع أول 10 صور GIF بدون القيم الفارغة
  } catch (error) {
    throw error;
  } finally {
    await browser.close(); // ضمان إغلاق المتصفح في جميع الحالات
  }
}