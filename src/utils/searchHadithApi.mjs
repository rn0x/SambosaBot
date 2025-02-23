import fetch from 'node-fetch';
import { logError, logInfo } from './logger.mjs';

/**
 * Search for Hadith using a word or phrase.
 * @param {string} query - The word or phrase to search for.
 * @returns {Promise<Object>} - The structured response containing Hadith data.
 */
export async function searchHadithApi(query) {
  const apiUrl = `https://alminasa.ai/api/semantic?search=${encodeURIComponent(query)}`;

  try {
    // Make a request to the API
    const response = await fetch(apiUrl);
    
    // Check if the response is successful
    if (!response.ok) {
      logInfo(`API request failed with status ${response.status}`);
    }

    // Parse the JSON data
    const data = await response.json();

    // Extract and return important Hadith data
    return data.data.map((hadith) => ({
      hadith_id: hadith._source.hadith_id,
      text: hadith._source.rerank_text || hadith._source.hadith,
      book: hadith._source.hadith_book_name,
      chapter: hadith._source.chapter,
      page: hadith._source.page,
      volume: hadith._source.volume,
      narrators: hadith._source.narrators.map(narrator => ({
        name: narrator.full_name,
        grade: narrator.grade,
        is_companion: narrator.is_companion
      })),
      rulings: hadith._source.rulings ? hadith._source.rulings.map(ruling => ({
        ruling: ruling.ruling,
        scholar: ruling.ruler,
        book: ruling.book_name
      })) : []
    }));
  } catch (error) {
    logError('Error fetching data:', error.message);
    throw error;
  }
}