// processors/stickers/textToSticker.mjs

import { generateImageFromHtml } from '../../utils/generateImage.mjs';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';

// أنماط متقدمة مع ألوان مميزة
const styles = {
    1: {
        font: "'Noto Naskh Arabic', sans-serif",
        color: "#000",
        shadow: "4px 4px 12px rgba(0,0,0,0.9)",
        fontSize: "52px"
    },
    2: {
        font: "'Lalezar', cursive",
        color: "#FFD700",
        shadow: "3px 3px 8px rgba(0,0,0,0.7), -1px -1px 2px rgba(255,255,255,0.2)",
        fontSize: "56px"
    },
    3: {
        font: "'Reem Kufi', sans-serif",
        color: "#2f34d1",
        shadow: "0 0 15px rgba(0,0,0,0.8)",
        fontSize: "59px"
    },
    4: {
        font: "'El Messiri', sans-serif",
        color: "#FF7F50",
        shadow: "2px 2px 6px rgba(0,0,0,0.6), 0 0 4px rgba(255,255,255,0.3)",
        fontSize: "54px"
    },
    5: {
        font: "'Amiri', serif",
        color: "#a91818",
        shadow: "3px 3px 10px rgba(0,0,0,0.9)",
        fontSize: "57px"
    },
    6: {
        font: "'Changa', sans-serif",
        color: "#98FB98",
        shadow: "2px 2px 8px rgba(0,0,0,0.7)",
        fontSize: "50px"
    },
    7: {
        font: "'Jomhuria', cursive",
        color: "#FF4500",
        shadow: "0 0 12px rgba(255,69,0,0.5), 2px 2px 4px rgba(0,0,0,0.6)",
        fontSize: "58px"
    },
    8: {
        font: "'Mirza', serif",
        color: "#9370DB",
        shadow: "3px 3px 10px rgba(0,0,0,0.8)",
        fontSize: "52px"
    },
    9: {
        font: "'Aref Ruqaa', serif",
        color: "#183fa9",
        shadow: "0 0 10px rgba(0,0,0,0.8), 1px 1px 2px rgba(255,255,255,0.5)",
        fontSize: "58px"
    },
    10: {
        font: "'Scheherazade New', serif",
        color: "#18a038",
        shadow: "2px 2px 8px rgba(0,0,0,0.7)",
        fontSize: "58px"
    }
};

// قالب HTML مع تحسينات الألوان
const dynamicTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@700&family=Lalezar&family=Reem+Kufi&family=El+Messiri:wght@600&family=Amiri:ital@1&family=Changa:wght@500&family=Jomhuria&family=Mirza&family=Aref+Ruqaa&family=Scheherazade+New&display=swap');
        
        html {
            background-color: #00000000;
            background: transparent !important;
        }

        body {
            width: 512px;
            height: 512px;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #00000000;
            background: transparent !important;
            overflow: hidden;
        }
        
        .text-container {
            font-family: {{font}};
            color: {{color}};
            font-size: {{fontSize}};
            text-align: center;
            text-shadow: {{shadow}};
            max-width: 85%;
            line-height: 1.4;
            padding: 20px;
            word-wrap: break-word;
            filter: drop-shadow(0 0 3px rgba(0,0,0,0.2));
            text-rendering: geometricPrecision;
            -webkit-font-smoothing: subpixel-antialiased;
        }
    </style>
</head>
<body>
    <div class="text-container" dir="rtl">{{text}}</div>
</body>
</html>
`;

export default async function textToSticker(message, MessageMedia, messageMeta) {
    try {
        const commandMatch = message.body.match(/^!كتابة(\d{1,2})?\s*(.*)/);
        if (!commandMatch) return;

        let [, styleInput, text] = commandMatch;
        const styleNumber = styleInput
            ? Math.min(Math.max(parseInt(styleInput), 1), 10)
            : 1;

        if (!text.trim()) {
            const exampleText = 'مثال: !كتابة7 مرحبًا بالعالم 🌍';
            return await message.reply(`📝 يرجى إدخال نص صحيح بعد الأمر\n${exampleText}`);
        }

        await message.reply(`⚡ طلبتَ النمط ${styleNumber}.. الملصق قادم خلال ثوانٍ 🚀`);

        const { font, color, shadow, fontSize } = styles[styleNumber];

        const base64Image = await generateImageFromHtml({
            htmlTemplate: dynamicTemplate,
            data: {
                font,
                color,
                shadow,
                fontSize,
                text: text.replace(/\n/g, '<br>')
            },
            viewport: {
                width: 512,
                height: 512,
                deviceScaleFactor: 2
            },
            retryCount: 3
        });

        const media = new MessageMedia('image/png', base64Image, 'sticker.png');

        await message.reply(media, null, {
            sendMediaAsSticker: true,
            stickerAuthor: messageMeta.pushname || messageMeta.number,
            stickerName: config.stickerName,
            stickerCategories: ['🎨', '✨', '❤️']
        });

    } catch (error) {
        logger.error('فشل إنشاء الملصق:', error);
        const errorMsg = config.isDevelopment
            ? `⚠️ خطأ تقني: ${error.message}`
            : '❌ حدث خطأ غير متوقع، يرجى المحاولة بوقت لاحق';
        await message.reply(errorMsg);
    }
}