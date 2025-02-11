// src/utils/addTextToVideo.mjs

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';

const execPromise = promisify(exec);

/**
 * يحسب عرض النص التقريبي بالبكسل بناءً على حجم الخط
 * (تقريبية - يمكن ضبطها حسب الخط المستخدم)
 */
const getTextWidth = (text, fontSize) => {
  const avgCharWidth = fontSize * 0.6; // تعديل هذه القيمة حسب دقة الخط
  return text.length * avgCharWidth;
};

/**
 * يقسم النص إلى أسطر بناءً على العرض الأقصى للفيديو
 */
const splitText = (text, videoWidth, fontSize) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;
  const maxLineWidth = videoWidth * 0.9; // 90% من عرض الفيديو

  for (const word of words) {
    const wordWidth = getTextWidth(word, fontSize);
    const spaceWidth = currentLine.length > 0 ? getTextWidth(' ', fontSize) : 0;

    if (currentWidth + spaceWidth + wordWidth <= maxLineWidth) {
      currentLine.push(word);
      currentWidth += spaceWidth + wordWidth;
    } else {
      lines.push(currentLine.join(' '));
      currentLine = [word];
      currentWidth = wordWidth;
    }
  }

  if (currentLine.length > 0) lines.push(currentLine.join(' '));
  return lines;
};

/**
 * يحصل على أبعاد الفيديو باستخدام ffprobe
 */
const getVideoDimensions = async (inputFile) => {
  const { stdout } = await execPromise(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputFile}"`);
  const [width, height] = stdout.trim().split('x').map(Number);
  return { width, height };
};

/**
 * يولد فلتر drawtext مع حسابات ديناميكية
 */
const generateDrawTextFilter = (lines, videoHeight, fontPath, fontSize, fontColor) => {
  const lineSpacing = fontSize * 0.2;
  const totalTextHeight = (fontSize + lineSpacing) * lines.length;
  const startY = videoHeight - totalTextHeight - (videoHeight * 0.05); // 5% من الأسفل

  return lines.map((line, index) => {
    const y = startY + (index * (fontSize + lineSpacing));
    return `drawtext=text='${line}':fontfile='${fontPath}':fontcolor=${fontColor}:fontsize=${fontSize}:borderw=5:bordercolor=black:shadowcolor=black:shadowx=2:shadowy=2:x=(w-text_w)/2:y=${y}`;
  }).join(', ');
};

/**
 * الإصدار المحسن من الدالة الرئيسية
 */
const addTextToVideo = async (options) => {
  const {
    inputFile,
    outputFile,
    text,
    fontPath,
    fontSize = 70,
    fontColor = 'yellow',
    duration = 7,
  } = options;

  // جلب أبعاد الفيديو
  const { width: videoWidth, height: videoHeight } = await getVideoDimensions(inputFile);

  // تقسيم النص بناءً على العرض الفعلي
  const lines = splitText(text, videoWidth, fontSize);

  // توليد الفلتر
  const drawTextFilter = generateDrawTextFilter(
    lines,
    videoHeight,
    fontPath.replace(/\\/g, '/'),
    fontSize,
    fontColor
  );

  // بناء أمر FFmpeg
  const ffmpegCommand = `ffmpeg -y -i "${inputFile}" -vf "${drawTextFilter}" -t ${duration} -c:a copy "${outputFile}"`;

  try {
    await execPromise(ffmpegCommand);
  } catch (error) {
    await fs.remove(options.inputFile);
    throw new Error(`فشل في معالجة الفيديو: ${error}`);
  }
};

export default addTextToVideo;