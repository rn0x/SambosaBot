/**
 * @license
 * MIT License
 * 
 * Author: rn0x (Rayan Almalki)
 * Telegram: @f93ii
 * Phone: +966553556010
 * Email: rn0x.me@gmail.com
 */

import puppeteer from 'puppeteer-core';
import logger from './logger.mjs'
import { config } from '../../config.mjs'

let browser; logger

// دالة تهيئة المتصفح

/**
 * Initializes the Puppeteer browser instance.
 * Ensures a single browser instance is running.
 * @throws {Error} If the browser fails to initialize.
 */
async function initBrowser() {
    try {
        if (!browser || !(await browser.isConnected())) {
            browser = await puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-cache',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-extensions',
                ],
                executablePath: config.PuppeteerPath,
                headless: 'new',
                ignoreDefaultArgs: ['--enable-automation'],
            });
            logger.info("Browser initialized successfully.");
        }
    } catch (error) {
        logger.error("Error initializing the browser:", error);
        throw new Error('Failed to initialize the browser: ' + error.message);
    }
}

// دالة إغلاق المتصفح
/**
 * Closes the Puppeteer browser instance if it's open.
 */
async function closeBrowser() {
    if (browser) {
        try {
            await browser.close();
            logger.info("Browser closed successfully.");
        } catch (error) {
            logger.error("Error closing the browser:", error);
        } finally {
            browser = null;
        }
    }
}

// دالة توليد الصورة من HTML
/**
 * Generates a base64-encoded image from an HTML template.
 * 
 * @param {Object} options - The options for generating the image.
 * @param {string} options.htmlTemplate - The HTML template string.
 * @param {Object} [options.data={}] - Data to replace placeholders in the template.
 * @param {number} [options.retryCount=3] - Number of retries in case of failure.
 * @param {Object} [options.viewport={ width: 1920, height: 1080, deviceScaleFactor: 2 }] - The viewport settings for the Puppeteer browser instance.
 * @param {number} options.viewport.width - The width of the viewport.
 * @param {number} options.viewport.height - The height of the viewport.
 * @param {number} options.viewport.deviceScaleFactor - The device scale factor (default is 2 for high-resolution screens).
 * 
 * @returns {Promise<string>} The base64-encoded image data.
 * @throws {Error} If the image generation fails after all retries.
 * 
 * @example
 * import { generateImageFromHtml } from './imageGenerator.mjs';
 * 
 * const htmlTemplate = '<div><h1>{{title}}</h1></div>';
 * const data = { title: 'Hello, World!' };
 * 
 * generateImageFromHtml({ htmlTemplate, data, viewport: { width: 600, height: 600 } })
 *     .then((base64Image) => {
 *         console.log('Generated image:', base64Image);
 *         console.log('Generated image Buffer:', Buffer.from(base64Image, 'base64'));
 *     })
 *     .catch((error) => {
 *         console.error('Error generating image:', error);
 *     });
 */
export async function generateImageFromHtml({ htmlTemplate, data = {}, retryCount = 3, viewport = { width: 1920, height: 1080, deviceScaleFactor: 2 } }) {
    let page;
    for (let attempt = 0; attempt < retryCount; attempt++) {
        try {
            await initBrowser();

            page = await browser.newPage();
            await page.setCacheEnabled(false);

            // ضبط اعتراض الطلبات
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (['redirect'].includes(request.redirectChain().length)) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            // دمج البيانات مع القالب
            const html = Object.keys(data).reduce(
                (acc, key) => acc.replace(new RegExp(`{{${key}}}`, 'g'), data[key]),
                htmlTemplate
            );

            // ضبط عرض الصفحة
            await page.setViewport(viewport);

            // ضبط محتوى الصفحة
            await page.setContent(html, { waitUntil: 'networkidle0' });
            await new Promise((r) => setTimeout(r, 2000));

            // إعداد خيارات الصورة
            const screenshotOptions = {
                type: 'png',
                encoding: 'base64',
                fullPage: true,
            };

            const base64Data = await page.screenshot(screenshotOptions);
            return base64Data;

        } catch (error) {
            logger.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt === retryCount - 1) {
                throw new Error('Error generating image: ' + error.message);
            }
            await closeBrowser();
            await new Promise((r) => setTimeout(r, 2000));
        } finally {
            if (page) {
                await page.close();
            }
        }
    }
}

// تأكد من إغلاق المتصفح عند إنهاء التطبيق
process.on('exit', closeBrowser);
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);
process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception:', error);
    await closeBrowser();
    process.exit(1);
});
