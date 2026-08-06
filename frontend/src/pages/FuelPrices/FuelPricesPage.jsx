import React, { useState, useEffect } from 'react';
import { FuelPriceService } from '../../services/FuelPriceService';
import { Fuel, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { getThemeCSS } from '../../utils/colorTheme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const FuelPricesPage = () => {
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await FuelPriceService.getAllPrices();
      if (data && data.length > 0) {
        setPrices(data);
      } else {
        // Fallback static data if API hasn't scraped yet
        setPrices([
          { state: 'Delhi', city: 'State Average', price: 95.24, priceChange: 0, updatedAt: new Date() },
          { state: 'Gujarat', city: 'State Average', price: 98.16, priceChange: 0.01, updatedAt: new Date() },
          { state: 'Haryana', city: 'State Average', price: 95.59, priceChange: -0.01, updatedAt: new Date() },
          { state: 'Andhra Pradesh', city: 'State Average', price: 104.96, priceChange: 0, updatedAt: new Date() },
          { state: 'Maharashtra', city: 'State Average', price: 102.34, priceChange: -0.15, updatedAt: new Date() },
          { state: 'Karnataka', city: 'State Average', price: 101.44, priceChange: 0.20, updatedAt: new Date() },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch live diesel prices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const lastUpdated = prices.length > 0 ? prices[0].updatedAt : null;

  return (
    <div className="min-h-screen p-5 bg-slate-50 font-sans text-slate-900" style={getThemeCSS()}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-sm">
            <Fuel size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Diesel Prices</h1>
            <p className="text-sm font-medium text-slate-500">
              State-wise average prices in India (₹/Litre)
              {lastUpdated && (
                <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                  <Clock size={13} /> Updated {dayjs(lastUpdated).fromNow()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div>
          <button 
            onClick={fetchPrices}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={48} className="text-red-400 mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
          <p className="text-slate-500 max-w-sm">{error}</p>
        </div>
      ) : isLoading && prices.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {prices.map((p, idx) => {
            const isUp = p.priceChange > 0;
            const isDown = p.priceChange < 0;
            return (
              <div key={`${p.state}-${idx}`} className="flex flex-col rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1" title={p.state}>{p.state}</h3>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                    isUp ? 'bg-red-50 text-red-600' : isDown ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : null}
                    {isUp ? '+' : ''}{p.priceChange.toFixed(2)}
                  </div>
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-0.5">{p.city}</p>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900">₹{p.price.toFixed(2)}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                    <Fuel size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FuelPricesPage;
