import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, TrendingUp, TrendingDown, Activity, Globe, BarChart3, Loader2, RefreshCcw } from 'lucide-react';
import finnhubClient from '../../lib/finnhub';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
}

export const StockMarketView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

  useEffect(() => {
    fetchInitialStocks();
  }, []);

  const fetchInitialStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        defaultSymbols.map(symbol => fetchStockData(symbol))
      );
      setStocks(results.filter((s): s is StockData => s !== null));
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = (symbol: string): Promise<StockData | null> => {
    return new Promise((resolve) => {
      finnhubClient.quote(symbol, (error: any, data: any) => {
        if (error || !data || data.c === 0) {
          resolve(null);
        } else {
          resolve({
            symbol,
            price: data.c,
            change: data.d,
            percentChange: data.dp,
            high: data.h,
            low: data.l,
            open: data.o
          });
        }
      });
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    const data = await fetchStockData(searchQuery.toUpperCase());
    if (data) {
      setStocks(prev => {
        const filtered = prev.filter(s => s.symbol !== data.symbol);
        return [data, ...filtered];
      });
      setSearchQuery('');
    } else {
      setError('Symbol not found');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black mb-2">Global Markets</h2>
          <p className="text-gray-500 text-sm">Real-time stock data powered by Finnhub</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search symbol (e.g. AAPL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all"
          />
        </form>
      </div>

      {/* Market Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stocks.slice(0, 4).map((stock) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/5 border border-white/10 rounded-[2rem] relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-xs">
                  {stock.symbol}
                </div>
                <span className="font-bold text-white">{stock.symbol}</span>
              </div>
              <Activity className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-black text-white">${stock.price.toFixed(2)}</div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div>Open: <span className="text-white">${stock.open.toFixed(2)}</span></div>
              <div>High: <span className="text-white">${stock.high.toFixed(2)}</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Market List */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Watchlist
          </h3>
          <button 
            onClick={fetchInitialStocks}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Change</th>
                <th className="px-6 py-4">High/Low</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && stocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : stocks.map((stock) => (
                <tr key={stock.symbol} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center font-black text-[10px]">
                        {stock.symbol}
                      </div>
                      <span className="font-bold text-white">{stock.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-white">${stock.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1 font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-400">
                      <span className="text-emerald-400">${stock.high.toFixed(2)}</span>
                      <span className="mx-2">/</span>
                      <span className="text-rose-400">${stock.low.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
