// processors/stickers/imageToSticker.mjs

import { generateImageFromHtml } from '../../utils/generateImage.mjs';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';

const styles = {
    1: {
        font: "'Noto Naskh Arabic', sans-serif",
        color: "#000",
        shadow: "4px 4px 12px rgba(0,0,0,0.9)",
        fontSize: "72px"
    },
    2: {
        font: "'Lalezar', cursive",
        color: "#FFD700",
        shadow: "3px 3px 8px rgba(0,0,0,0.7), -1px -1px 2px rgba(255,255,255,0.2)",
        fontSize: "76px"
    },
    3: {
        font: "'Reem Kufi', sans-serif",
        color: "#2f34d1",
        shadow: "0 0 15px rgba(0,0,0,0.8)",
        fontSize: "79px"
    },
    4: {
        font: "'El Messiri', sans-serif",
        color: "#FF7F50",
        shadow: "2px 2px 6px rgba(0,0,0,0.6), 0 0 4px rgba(255,255,255,0.3)",
        fontSize: "74px"
    },
    5: {
        font: "'Amiri', serif",
        color: "#a91818",
        shadow: "3px 3px 10px rgba(0,0,0,0.9)",
        fontSize: "77px"
    },
    6: {
        font: "'Changa', sans-serif",
        color: "#98FB98",
        shadow: "2px 2px 8px rgba(0,0,0,0.7)",
        fontSize: "70px"
    },
    7: {
        font: "'Jomhuria', cursive",
        color: "#FF4500",
        shadow: "0 0 12px rgba(255,69,0,0.5), 2px 2px 4px rgba(0,0,0,0.6)",
        fontSize: "78px"
    },
    8: {
        font: "'Mirza', serif",
        color: "#9370DB",
        shadow: "3px 3px 10px rgba(0,0,0,0.8)",
        fontSize: "72px"
    },
    9: {
        font: "'Aref Ruqaa', serif",
        color: "#183fa9",
        shadow: "0 0 10px rgba(0,0,0,0.8), 1px 1px 2px rgba(255,255,255,0.5)",
        fontSize: "78px"
    },
    10: {
        font: "'Scheherazade New', serif",
        color: "#18a038",
        shadow: "2px 2px 8px rgba(0,0,0,0.7)",
        fontSize: "78px"
    }
};

const dynamicTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@700&family=Lalezar&family=Reem+Kufi&family=El+Messiri:wght@600&family=Amiri:ital@1&family=Changa:wght@500&family=Jomhuria&family=Mirza&family=Aref+Ruqaa&family=Scheherazade+New&display=swap');
        
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: transparent;
        }

        body {
            width: 512px;
            height: 512px;
            position: relative;
            background-image: url('data:{{imageMimeType}};base64,{{imageBase64}}');
            background-size: cover;
            background-position: center;
        }
        
        .text-container {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            font-family: {{font}}, 'Noto Color Emoji', sans-serif;
            color: {{color}};
            font-size: {{effectiveFontSize}};
            text-align: center;
            text-shadow: {{shadow}};
            line-height: 1.25;
            padding: 10px 15px;
            word-wrap: break-word;
            border-radius: 8px;
            max-height: 65%;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div class="text-container" dir="rtl">{{text}}</div>
</body>
</html>
`;

export default async function imageToSticker(message, MessageMedia, messageMeta) {
    try {
        // التحقق من وجود ميديا أو رد على ميديا
        let media;
        let commandText = '';

        if (message.hasMedia) {
            media = await message.downloadMedia();
            commandText = message.body || message._data?.caption || '';
        } else if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                media = await quotedMsg.downloadMedia();
                commandText = message.body;
            }
        }

        if (!media || !media.mimetype.startsWith('image/')) return;

        // معالجة الأمر
        const commandMatch = commandText.match(/^!صورة(\d{1,2})?\s*(.*)/);
        if (!commandMatch) return;

        let [, styleInput, text] = commandMatch;
        const styleNumber = styleInput
            ? Math.min(Math.max(parseInt(styleInput), 1), 10)
            : 1;

        if (!text.trim()) {
            const exampleText = 'مثال: !صورة7 مرحبًا بالعالم 🌍';
            return await message.reply(`📝 يرجى إدخال نص صحيح بعد الأمر\n${exampleText}`);
        }

        await message.reply(`⚡ طلبتَ النمط ${styleNumber}.. الملصق قادم خلال ثوانٍ 🚀`);

        // تحضير البيانات
        const originalStyle = styles[styleNumber];
        let effectiveFontSize = parseInt(originalStyle.fontSize);
        
        // حساب حجم الخط بناءً على طول النص
        const textLength = text.trim().length;
        if (textLength > 40) effectiveFontSize -= 8;
        if (textLength > 60) effectiveFontSize -= 7;
        if (textLength > 80) effectiveFontSize -= 5;
        
        // الحد الأدنى لحجم الخط
        effectiveFontSize = Math.max(effectiveFontSize, 40);

        const base64Image = await generateImageFromHtml({
            htmlTemplate: dynamicTemplate,
            data: {
                font: originalStyle.font,
                color: originalStyle.color,
                shadow: originalStyle.shadow,
                effectiveFontSize: `${effectiveFontSize}px`,
                text: text.replace(/\n/g, '<br>'),
                imageBase64: media.data,
                imageMimeType: media.mimetype
            },
            viewport: {
                width: 512,
                height: 512,
                deviceScaleFactor: 2
            },
            retryCount: 3
        });

        // إرسال كملصق
        const mediaResult = new MessageMedia('image/png', base64Image, 'sticker.png');
        await message.reply(mediaResult, null, {
            sendMediaAsSticker: true,
            stickerAuthor: messageMeta.pushname || messageMeta.number,
            stickerName: config.stickerName,
            stickerCategories: ['🎨', '✨', '❤️']
        });

    } catch (error) {
        logger.error('فشل إنشاء ملصق الصورة:', error);
    }
}