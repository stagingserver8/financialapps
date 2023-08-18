const XLSX = require('xlsx');
const fetch = require('node-fetch');

const getSentimentData = async (tickers, fromDate, toDate) => {
    const baseUrl = 'https://eodhistoricaldata.com/api/sentiments';
    
    // Convert the tickers array to a comma-separated string
    const tickerString = tickers.join(',');

    // Construct the URL with parameters
    const url = `${baseUrl}?s=${tickerString}&from=${fromDate}&to=${toDate}&api_token=XX`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sentiment data:', error);
    }
};

// Adjust the tickers array to match the keys in the data object
const tickers = ['TSLA.US', 'MSFT.US', 'FB.US'];

const downloadExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();

    tickers.forEach(ticker => {
        const tickerData = data[ticker];
        if (tickerData && tickerData.length) {
            const tickerDataArray = tickerData.map(entry => {
                return {
                    date: entry.date,
                    sentiment: entry.normalized
                };
            });

            const ws = XLSX.utils.json_to_sheet(tickerDataArray);
            XLSX.utils.book_append_sheet(wb, ws, ticker); // The sheet name can still be just 'TSLA', 'MSFT', etc.
        } else {
            console.warn(`No data available for ticker: ${ticker}`);
        }
    });

    if (wb.SheetNames.length === 0) {
        console.error("No sheets added to the workbook. Check your data and tickers.");
        return;
    }

    XLSX.writeFile(wb, filename);
};


getSentimentData(tickers, '2022-08-15', '2023-08-14').then(data => {
    console.log('Sentiment Data:', data);
    downloadExcel(data, 'sentiment_data.xlsx');
});

