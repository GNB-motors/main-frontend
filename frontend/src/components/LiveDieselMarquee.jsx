import React, { useEffect, useState } from 'react';
import { FuelPriceService } from '../services/FuelPriceService';
import { ChevronRight, Fuel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LiveDieselMarquee = () => {
  const [prices, setPrices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const data = await FuelPriceService.getMarqueePrices();
        if (data && data.length > 0) {
          setPrices(data);
        } else {
          // Fallback static data if API hasn't scraped yet
          setPrices([
            { state: 'Delhi', price: 95.24, priceChange: 0 },
            { state: 'Gujarat', price: 98.16, priceChange: 0.01 },
            { state: 'Haryana', price: 95.59, priceChange: -0.01 },
            { state: 'Andhra Pradesh', price: 104.96, priceChange: 0 }
          ]);
        }
      } catch (error) {
        console.error('Failed to load marquee prices', error);
      }
    };
    fetchPrices();
  }, []);

  if (prices.length === 0) return null;

  return (
    <div className="relative flex items-center bg-blue-50/80 border-b border-blue-100 py-1.5 px-3 overflow-hidden text-sm">
      {/* Fixed Icon on the left */}
      <div className="flex items-center justify-center shrink-0 mr-3 text-blue-600 bg-white rounded shadow-sm p-1 z-10">
        <Fuel size={18} />
      </div>

      {/* Marquee Container */}
      <div className="flex-1 overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-3">
          {/* Duplicate prices for seamless loop */}
          {[...prices, ...prices, ...prices].map((p, idx) => (
            <div key={`${p.state}-${idx}`} className="flex items-center bg-white rounded px-2.5 py-1 border border-slate-100 shadow-sm">
              <span className="font-medium text-slate-700 mr-2">{p.state}</span>
              <span className={`font-bold ${p.priceChange > 0 ? 'text-red-500 bg-red-50' : p.priceChange < 0 ? 'text-green-600 bg-green-50' : 'text-slate-600 bg-slate-50'} px-1.5 rounded`}>
                ₹{p.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed View All on the right */}
      <button 
        onClick={() => navigate('/fuel-prices')}
        className="shrink-0 flex items-center ml-3 bg-white hover:bg-slate-50 text-blue-600 font-semibold px-3 py-1 rounded shadow-sm transition-colors z-10"
      >
        View all <ChevronRight size={16} className="ml-1" />
      </button>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LiveDieselMarquee;
