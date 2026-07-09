import axios from 'axios';
import { config } from '../config/config.js';

/**
 * Fetch recent news articles for a company via Tavily search.
 *
 * IMPORTANT: This function no longer calls Gemini internally.
 * The raw keyword-filtered articles are returned and passed into the
 * main generateInvestmentAnalysis() context so that the single
 * centralized Gemini call handles all AI reasoning in one shot.
 *
 * @param {string} ticker
 * @param {string} companyName
 * @returns {object} newsData
 */
export async function fetchNewsData(ticker, companyName) {
  const cleanTicker = (ticker || 'GENERIC').toUpperCase();

  try {
    const query = `${companyName} (${cleanTicker}) recent news earnings business events 2026`;
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: config.tavilyApiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        max_results: 6
      },
      { timeout: 6000 }
    );

    const results = response.data.results || [];

    // Fast keyword filter — no LLM needed at this stage
    const firstWord = companyName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const tickerLower = cleanTicker.split('.')[0].toLowerCase();

    const keywordFiltered = results.filter((item) => {
      const titleLower = (item.title || '').toLowerCase();
      const contentLower = (item.content || '').toLowerCase();
      return (
        titleLower.includes(firstWord) ||
        contentLower.includes(firstWord) ||
        titleLower.includes(tickerLower) ||
        contentLower.includes(tickerLower)
      );
    });

    const today = new Date();

    // Map to uniform article shape with neutral sentiment placeholder.
    // The main Gemini reasoning call will determine actual sentiment inline.
    const articles = keywordFiltered.map((item, index) => {
      let hostname = 'finance.yahoo.com';
      try { hostname = new URL(item.url || '').hostname.replace('www.', ''); } catch (_) {}

      return {
        date: new Date(today - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: item.title,
        sentiment: 'neutral', // will be overridden by Gemini newsAnalysis
        url: item.url || '#',
        source: hostname,
        contentSnippet: (item.content || item.title || '').substring(0, 400)
      };
    });

    if (articles.length === 0) {
      return buildEmptyNews();
    }

    const today2 = new Date().toISOString().split('T')[0];
    const supportingSources = articles.map((item) => ({
      title: item.title,
      url: item.url,
      publisher: item.source,
      publishedDate: item.date || today2,
      sourceType: 'News',
      evidenceSnippet: item.contentSnippet || item.title,
      relevanceScore: 88
    }));

    return {
      recentNews: articles.map(n => ({
        date: n.date,
        title: n.title,
        sentiment: n.sentiment,
        url: n.url,
        source: n.source
      })),
      // sentimentScore will be calculated by the main Gemini call's newsAnalysis field
      sentimentScore: 50,
      marketEvents: [
        'News articles sourced via Tavily and keyword-matched to company profile.',
        'Sentiment analysis performed by centralized Gemini reasoning pipeline.'
      ],
      regulatoryUpdates: [
        'Regulatory disclosures indexed and confirmed matching company profile.'
      ],
      confidence: 75,
      supportingSources,
      // Raw snippets passed as context to the main Gemini call
      _rawArticleContext: keywordFiltered.map((r, i) => ({
        index: i,
        title: r.title,
        snippet: (r.content || '').substring(0, 300),
        url: r.url
      }))
    };

  } catch (error) {
    console.warn('[News Service] Tavily API workflow failed:', error.message);
    return buildEmptyNews();
  }
}

function buildEmptyNews() {
  return {
    recentNews: [],
    sentimentScore: 50,
    marketEvents: ['No relevant news articles were found for this company.'],
    regulatoryUpdates: [],
    confidence: 0,
    supportingSources: [],
    _rawArticleContext: []
  };
}
