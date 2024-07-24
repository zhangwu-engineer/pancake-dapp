export const generateRandomIndices = (max, count) => {
  const maxNumber = Number(max)
  const indices = new Set();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * maxNumber));
  }
  return Array.from(indices);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchTokenPrices = async (tokenAddresses) => {
  const baseUrl = 'https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain';
  const tokenPrices = {};
  const failedAddrs = []

  for (const address of tokenAddresses) {
    const query = `?vs_currencies=usd&contract_addresses=${address}`;
    const url = `${baseUrl}${query}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      Object.assign(tokenPrices, data);
    } catch (error) {
      failedAddrs.push(address)
      console.error(`Error fetching token price for ${address}:`, error);
    }

    // Delay between requests to avoid rate limits
    await delay(2000); // Adjust delay as necessary
  }

  return { tokenPrices, failedAddrs };
};
