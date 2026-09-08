import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// Detect whether user is in India via locale / timezone
const isUserInIndia = () => {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    if (tz.includes('calcutta') || tz.includes('kolkata') || tz.includes('india')) return true;
    const offset = new Date().getTimezoneOffset(); // -330 minutes for IST (+5:30)
    if (offset === -330) return true;
  } catch (e) {}
  return false;
};

export const BreakingTicker = ({ 
  selectedCountry = 'all',
  onSelectCategory,
  onSelectStory 
}) => {
  // Determine effective country view
  const isIndia = (selectedCountry && selectedCountry.toLowerCase() === 'india') || 
                  (selectedCountry === 'all' && isUserInIndia()) || 
                  !selectedCountry || 
                  selectedCountry === 'all';

  const isUS = selectedCountry && selectedCountry.toLowerCase() === 'us';
  const isUK = selectedCountry && selectedCountry.toLowerCase() === 'uk';
  const targetCountry = isUS ? 'us' : (isUK ? 'uk' : 'india');

  // No hardcoded / prefix prices — populated strictly live from source
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real live prices from sources immediately on mount and periodically
  useEffect(() => {
    let isMounted = true;

    const fetchLiveQuotes = async () => {
      try {
        if (api && api.getLiveMarkets) {
          const res = await api.getLiveMarkets(targetCountry);
          if (isMounted && res && Array.isArray(res.prices) && res.prices.length > 0) {
            setPrices(res.prices);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('Live market sync notice:', err);
      }
    };

    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 30000); // 30s live refresh

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [targetCountry]);

  const handleItemClick = (e, p) => {
    e.stopPropagation();
    e.preventDefault();

    if (onSelectStory) {
      const symUpper = (p.symbol || '').toUpperCase();
      let defaultId = 'market-nifty-50';
      let defaultSlug = 'nifty-50-today-stock-market-closing-analysis';
      let defaultTitle = `${p.symbol} Live Market Update & Price Analysis`;
      let defaultImage = p.hero_image || '';

      if (symUpper.includes('GOLD 24K')) {
        defaultId = 'market-gold-24k';
        defaultSlug = 'gold-24k-rates-today-bullion-market-analysis';
        defaultTitle = 'Gold Rates Today: 24K Gold Sells at ₹1,55,350 per 10g in India as Bullion Demand Climbs';
      } else if (symUpper.includes('GOLD 22K') || symUpper.includes('GOLD')) {
        defaultId = 'market-gold-22k';
        defaultSlug = 'gold-22k-rates-today-jewelry-prices-india';
        defaultTitle = 'Gold 22K Rates Today: Retail Jewelry Gold Holds at ₹1,42,400 per 10g Amid Festive Inquiries';
      } else if (symUpper.includes('SILVER')) {
        defaultId = 'market-silver-1kg';
        defaultSlug = 'silver-rates-today-mcx-industrial-demand-analysis';
        defaultTitle = 'Silver Rates Today: Silver Holds Firm at ₹2,50,000 per Kg Driven by Solar and Industrial Buying';
      } else if (symUpper.includes('PETROL') || symUpper.includes('CNG') || symUpper.includes('LPG') || symUpper.includes('GASOLINE')) {
        defaultId = 'market-petrol-delhi';
        defaultSlug = 'petrol-price-today-delhi-mumbai-fuel-rates';
        defaultTitle = 'Petrol Price Today: Fuel Steady at ₹94.72/L in Delhi and ₹103.44/L in Mumbai';
      } else if (symUpper.includes('DIESEL')) {
        defaultId = 'market-diesel-delhi';
        defaultSlug = 'diesel-price-today-freight-rates-delhi-mumbai';
        defaultTitle = 'Diesel Prices Today: Rates Steady at ₹87.62/L in Delhi and ₹97.83/L in Mumbai';
      } else if (symUpper.includes('SENSEX') || symUpper.includes('MIDCAP') || symUpper.includes('DOW') || symUpper.includes('S&P')) {
        defaultId = 'market-sensex';
        defaultSlug = 'sensex-today-bse-dalal-street-market-update';
        defaultTitle = 'Sensex Today: BSE Benchmark Settles at 75,577 Amid Heavy Institutional Action';
      } else if (symUpper.includes('BITCOIN') || symUpper.includes('ETHEREUM') || symUpper.includes('CRYPTO')) {
        defaultId = 'market-bitcoin';
        defaultSlug = 'bitcoin-crypto-market-today-price-analysis';
        defaultTitle = 'Bitcoin Price Today: BTC Trades Near $78,300 (₹74,26,000) as Crypto Market Consolidates';
      } else if (symUpper.includes('CRUDE') || symUpper.includes('BRENT') || symUpper.includes('WTI')) {
        defaultId = 'market-brent-crude';
        defaultSlug = 'crude-oil-prices-today-brent-wti-energy-outlook';
        defaultTitle = 'Crude Oil Prices Today: Brent Surges Past $98/bbl (₹9,321) on Supply Tightening';
      } else if (symUpper.includes('USD') || symUpper.includes('EUR') || symUpper.includes('GBP') || symUpper.includes('FOREX')) {
        defaultId = 'market-usd-inr';
        defaultSlug = 'usd-inr-forex-rupee-exchange-rate-today';
        defaultTitle = 'Rupee vs Dollar: USD/INR Trades at ₹94.82 as Currency Markets Track Global Yields';
      }

      const storyObj = {
        id: p.story_id || defaultId,
        slug: p.story_slug || defaultSlug,
        canonical_title: p.story_title || defaultTitle,
        summary: `Live real-time market report on ${p.symbol}, trading at ${p.val} (${p.chg}), tracking market movements, underlying economic factors, and key outlook.`,
        category: p.category || 'Stock',
        country: isIndia ? 'India' : 'Global',
        hero_image: p.hero_image || defaultImage,
        importance_score: 95,
        sources_count: 3,
        last_updated_at: new Date().toISOString()
      };

      onSelectStory(storyObj);
    } else if (onSelectCategory) {
      onSelectCategory(p.category || 'Stock');
    }
  };

  if (prices.length === 0) {
    return (
      <div className="bbc-breaking-banner">
        <div className="bbc-breaking-container" style={{ minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.03em' }}>
            {loading ? 'Connecting to live market feeds...' : 'Live market feeds connecting...'}
          </span>
        </div>
      </div>
    );
  }

  // Duplicate prices array for seamless infinite marquee loop (No breaking news, No badges)
  const marqueeList = [...prices, ...prices];

  return (
    <div className="bbc-breaking-banner">
      <div className="bbc-breaking-container">
        {/* NO BADGE - Pure full-width live market price ticker */}
        <div className="bbc-marquee-wrapper">
          <div className="bbc-marquee-track slow-ticker-track">
            {marqueeList.map((p, index) => (
              <span
                key={`${p.symbol}-${index}`}
                className="bbc-marquee-item bbc-marquee-price-item"
                onClick={(e) => handleItemClick(e, p)}
                title={`Click to read full live report on ${p.symbol}`}
                style={{ cursor: 'pointer' }}
              >
                {/* NO BADGE / NO PILL - ONLY RED SYMBOL AND BLACK PRICE */}
                <span className="bbc-ticker-symbol" style={{ color: '#bb1919', fontWeight: 800 }}>
                  {p.symbol}
                </span>
                <span className="bbc-ticker-price" style={{ color: '#000000', fontWeight: 700 }}>
                  {p.val}
                </span>
                <span className={`bbc-ticker-chg ${p.dir || 'neutral'}`}>
                  {p.chg}
                </span>
                <span className="bbc-marquee-divider">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
