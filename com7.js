const axios = require('axios');
const cheerio = require('cheerio');

const OPENAI_API_URL = 'https://api.openai.com/v1/engines/davinci/completions';
const API_KEY = 'x';
const countries = ['Poland', 'Turkey', 'Russia', 'Brazil'];

async function getFTResults(country) {
    let allResults = [];

    for (let page = 1; page <= 2; page++) { // Only first 2 pages
        const url = `https://www.ft.com/search?q=%22${encodeURIComponent(country)}%22&page=${page}&sort=date`;

        try {
            const response = await axios.get(url);
            const html = response.data;

            const $ = cheerio.load(html);
            const articles = $('.js-teaser-heading-link');

            articles.each((index, article) => {
                const headline = $(article).text();
                allResults.push(headline);
            });
        } catch (error) {
            console.error("Error fetching data for page", page, ":", error);
        }
    }

    return allResults;
}

async function getSentiment(text) {
    try {
        const response = await axios.post(OPENAI_API_URL, {
            prompt: `What is the sentiment of this text for the country: "${text}"? (positive, negative, neutral)`,
            max_tokens: 15
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        return data.choices[0].text.trim();
    } catch (error) {
        console.error("Error fetching sentiment:", error.message);
        return 'Unknown';
    }
}

async function analyzeSentimentsOfHeadlines(headlines) {
    const sentiments = [];

    for (const headline of headlines) {
        console.log(`Analyzing sentiment for headline: "${headline}"`); // Log the headline
        const sentiment = await getSentiment(headline);
        sentiments.push(sentiment);
    }

    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const neutralCount = sentiments.filter(s => s === 'neutral').length;

    if (positiveCount > negativeCount && positiveCount > neutralCount) return 'Positive';
    if (negativeCount > positiveCount && negativeCount > neutralCount) return 'Negative';
    return 'Neutral';
}

async function analyzeCountries() {
    const results = [];

    for (const country of countries) {
        const headlines = await getFTResults(country);
        const overallSentiment = await analyzeSentimentsOfHeadlines(headlines);
        results.push(`${country}: ${overallSentiment}`);
    }

    console.log("\nOverall Sentiments for Countries:");
    results.forEach(result => console.log(result));
}

analyzeCountries();
