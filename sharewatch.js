import axios from 'axios';

async function fetchIndicesManually() {
  try {
    const response = await axios.get('https://www.nseindia.com/api/allIndices', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
        'Referer': 'https://www.nseindia.com/'
      },
      timeout: 15000
    });
    console.log(response.data);
  } catch (error) {
    console.error('Manual request failed:', error.message);
  }
}

fetchIndicesManually();
