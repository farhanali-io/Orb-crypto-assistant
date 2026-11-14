import { CryptoCoin } from '../types/crypto';

let orbHistory: {role: 'user'|'assistant', text: string}[] = [];
function getLastCoinFromHistory(): string {
  for(let i=orbHistory.length-1;i>=0;i--){
    const t=orbHistory[i].text.toLowerCase();
    const m=t.match(/\b(btc|eth|sol|usd1|usdt|bnb|xrp|doge|trx|ada|avax)\b/);
    if(m) return m[0];
  }
  return '';
}

export function getOrbHistory(){ return orbHistory; }
export function clearOrbHistory(){ orbHistory = []; }

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

function formatCompact(val?: number): string {
  if (!val) return '0';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

export async function askOrbAssistant(
  question: string,
  coins: CryptoCoin[],
  _extHistory?: {role:string,text:string}[]
): Promise<string> {
  const cleanQ = question.trim();

  if (!cleanQ) {
    return 'Please enter a question about any cryptocurrency or market trend.\nCheck out our quick suggestions above for instant answers.\nWe track the Top 100 coins in real time.\nNot financial advice.';
  }

  const lq = cleanQ.toLowerCase();

  // ---- Short-circuit greetings: never hit the AI API ----
  const greetings = ['hi', 'hey', 'hello', 'yo', 'sup', 'howdy', 'hey orb', 'hi orb'];
  if (greetings.includes(lq)) {
    return "Hi! I'm Orb, your live crypto AI assistant.\nAsk me about any coin, market movers, or 24h stats.\nNot financial advice.";
  }
  if (lq.includes('how are you') || lq.includes('how r u') || lq.includes('how are u')) {
    return "I'm doing great, thanks for asking! I'm Orb, your crypto assistant.\nWhich coin would you like to know about?\nNot financial advice.";
  }

  // ---- Server call (Gemini / Groq) ----
  try {
    let qForApi = cleanQ;
    const lastCoin = getLastCoinFromHistory();
    if(lastCoin && /\b(its|it|that coin|monthly|yearly)\b/i.test(cleanQ) && !cleanQ.toLowerCase().includes(lastCoin)){
      qForApi = `${lastCoin} ${cleanQ}`;
    }
    const hist = _extHistory || orbHistory.slice(-5);
    const res = await fetch('/api/ask-orb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: qForApi, coins, history: hist }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.text === 'string' && data.text.trim()) {
        orbHistory.push({role:'user', text: cleanQ});
        orbHistory.push({role:'assistant', text: data.text.trim()});
        if(orbHistory.length>10) orbHistory=orbHistory.slice(-10);
        const t = data.text.trim();
        // Reject error strings so we fall through to local fallback
        if (!/busy|timeout|aborted|error|high demand|not available/i.test(t.slice(0, 50))) {
          return t;
        }
      }
    }
  } catch (err) {
    console.warn('AI unavailable, using local CoinGecko fallback.');
  }

  // ---- Local fallback (uses coins already loaded in browser) ----
  const btc = coins.find(c => c.symbol.toLowerCase() === 'btc') || coins[0];
  const eth = coins.find(c => c.symbol.toLowerCase() === 'eth') || coins[1];

  const sortedByChange = [...coins].sort(
    (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
  );
  const topGainers = sortedByChange.slice(0, 3);
  const topLosers = sortedByChange.slice(-3).reverse();
  const totalMarketCap = coins.reduce((acc, c) => acc + (c.market_cap || 0), 0);
  const avgChange =
    coins.reduce((acc, c) => acc + (c.price_change_percentage_24h || 0), 0) /
    (coins.length || 1);

  const matchedCoin = coins.find(c => {
    const sym = (c.symbol || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    const id = (c.id || '').toLowerCase();
    if (sym.length >= 2 && lq.includes(sym)) return true;
    if (name.length >= 3 && lq.includes(name)) return true;
    if (id.length >= 3 && lq.includes(id)) return true;
    return false;
  });

  return generateLiveResponse(cleanQ, {
    coins,
    btc,
    eth,
    topGainers,
    topLosers,
    totalMarketCap,
    avgChange,
    matchedCoin,
  });
}

interface MarketContext {
  coins: CryptoCoin[];
  btc?: CryptoCoin;
  eth?: CryptoCoin;
  topGainers: CryptoCoin[];
  topLosers: CryptoCoin[];
  totalMarketCap: number;
  avgChange: number;
  matchedCoin?: CryptoCoin;
}

function generateLiveResponse(question: string, ctx: MarketContext): string {
  // Check if question asks for monthly/yearly and we have history coin
  const lastCoin = ctx.matchedCoin;
  const qLower = question.toLowerCase();
  const wantsMonthly = qLower.includes('monthly') || qLower.includes('30d') || qLower.includes('30 day');
  const wantsYearly = qLower.includes('yearly') || qLower.includes('1y') || qLower.includes('365d');
  const wantsWeekly = qLower.includes('weekly') || qLower.includes('7d') || qLower.includes('7 day');

  if(lastCoin && (wantsMonthly || wantsYearly || wantsWeekly)){
    const coin = lastCoin;
    // CoinGecko free API often only has 24h, so explain
    return `${coin.name} (${coin.symbol.toUpperCase()}) is at ${coin.current_price?.toLocaleString()} now. 24h: ${coin.price_change_percentage_24h?.toFixed(2)}% | 7d data: ${(coin as any).price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A - use chart'} | 30d requires Pro API. Current market cap ${coin.market_cap?.toLocaleString()} rank #${coin.market_cap_rank}.\nNot financial advice.`;
  }

  const q = question.toLowerCase();

  if (q.includes('top gainer') || q.includes('gainers') || q.includes('who is up') || q.includes('best coin')) {
    const g1 = ctx.topGainers[0];
    const g2 = ctx.topGainers[1];
    const g3 = ctx.topGainers[2];
    const line1 = `Today's top gainers are ${g1?.name || 'Token'} (+${g1?.price_change_percentage_24h?.toFixed(1) || '0'}%), ${g2?.name || 'Token'} (+${g2?.price_change_percentage_24h?.toFixed(1) || '0'}%), and ${g3?.name || 'Token'} (+${g3?.price_change_percentage_24h?.toFixed(1) || '0'}%).`;
    const line2 = `These coins lead market momentum while the Top 100 average 24h change is ${ctx.avgChange >= 0 ? '+' : ''}${ctx.avgChange.toFixed(2)}%.`;
    const line3 = `Their bubbles glow bright green on Orbix reflecting strong upward buy volume.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  if (q.includes('btc') || q.includes('bitcoin')) {
    const btc = ctx.btc;
    const btcChange = btc?.price_change_percentage_24h ?? 0;
    const isDown = btcChange < 0;
    const line1 = `Bitcoin (BTC) is currently trading at $${btc?.current_price?.toLocaleString() || 'N/A'}, moving ${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}% over the last 24 hours.`;
    const line2 = `Trading has ranged between a 24-hour low of $${btc?.low_24h?.toLocaleString() || 'N/A'} and high of $${btc?.high_24h?.toLocaleString() || 'N/A'}.`;
    const line3 = isDown
      ? `Broader market liquidity contractions and profit-taking at resistance levels are driving short-term pressure.`
      : `Sustained spot demand and steady exchange inflows are supporting today's positive price momentum.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  if (q.includes('market cap') || q.includes('market capitalization') || q.includes('what is cap')) {
    const line1 = `Market capitalization represents a cryptocurrency's current price multiplied by its total circulating supply.`;
    const line2 = `The combined market cap of the Top 100 coins currently stands at ${formatCompact(ctx.totalMarketCap)}.`;
    const line3 = `On Orbix, bubble sizes directly scale with market cap so higher-valued coins appear larger.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  if (ctx.matchedCoin) {
    const coin = ctx.matchedCoin;
    const isUp = (coin.price_change_percentage_24h ?? 0) >= 0;
    const line1 = `${coin.name} (${coin.symbol.toUpperCase()}) is trading at $${coin.current_price?.toLocaleString() || '0'} with a 24-hour change of ${isUp ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || '0'}%.`;
    const line2 = `It holds market cap rank #${coin.market_cap_rank || '—'} with a total market valuation of ${formatCompact(coin.market_cap)}.`;
    const line3 = `Its 24-hour trading volume is ${formatCompact(coin.total_volume)}, with today's range between $${coin.low_24h?.toLocaleString() || 'N/A'} and $${coin.high_24h?.toLocaleString() || 'N/A'}.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  const line1 = `The Top 100 cryptocurrency market currently averages a ${ctx.avgChange >= 0 ? '+' : ''}${ctx.avgChange.toFixed(2)}% move across the board today.`;
  const line2 = `Bitcoin (BTC) anchors the market at $${ctx.btc?.current_price?.toLocaleString() || 'N/A'}, while ${ctx.topGainers[0]?.name || 'gainers'} leads top momentum.`;
  const line3 = `Total 24-hour tracked volume stands at ${formatCompact(ctx.coins.reduce((a, c) => a + (c.total_volume || 0), 0))}.`;
  return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
}
