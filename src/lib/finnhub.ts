const finnhubClient = {
  quote: async (symbol: string, callback: (error: any, data: any) => void) => {
    try {
      const normalizedSymbol = symbol.trim().toUpperCase();
      if (!/^[A-Z0-9:._-]{1,32}$/.test(normalizedSymbol)) {
        throw new Error('Invalid symbol');
      }

      throw new Error('Market quotes require a server-side provider endpoint.');
    } catch (error) {
      callback(error, null);
    }
  }
};

export default finnhubClient;
