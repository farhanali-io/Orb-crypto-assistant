import { CryptoCoin } from '../types/crypto';

let orbHistory: {role: 'user'|'assistant', text: string}[] = [];

function getLastCoinFromHistory(coins: CryptoCoin[]): CryptoCoin | null {
  for(let i=orbHistory.length-1;i>=0;i--){
    const t=orbHistory[i].text.toLowerCase();
    for(const c of coins){
      if(t.includes(c.symbol.toLowerCase()) || t.includes(c.name.toLowerCase()) || t.includes(c.id.toLowerCase())){
        return c;
      }
    }
  }
  return null;
}

export function getOrbHistory(){ return orbHistory; }
export function clearOrbHistory(){ orbHistory = []; }

export interface ChatMessage { id: string; sender: 'user' | 'assistant'; text: string; timestamp: number; }

function formatCompact(val?: number): string {
  if (!val) return '0';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

export async function askOrbAssistant(question: string, coins: CryptoCoin[], _extHistory?: {role:string,text:string}[]): Promise<string> {
  const cleanQ = question.trim();
  if (!cleanQ) return 'Please enter a question about any cryptocurrency.\nNot financial advice.';

  const lq = cleanQ.toLowerCase();
  const greetings = ['hi','hey','hello','yo','sup','howdy','hey orb','hi orb'];
  if (greetings.includes(lq)) return "Hi! I'm Orb, your live crypto AI assistant.\nAsk me about any coin, market movers, or 24h stats.\nNot financial advice.";
  if (lq.includes('how are you') || lq.includes('how r u')) return "I'm doing great! Which coin would you like to know about?\nNot financial advice.";

  const lastCoinObj = getLastCoinFromHistory(coins);
  const lastCoinSymbol = lastCoinObj?.symbol || '';

  // Try to answer monthly/weekly directly from local data FIRST (no AI needed)
  const wantsMonthly = lq.includes('monthly') || lq.includes('30d') || lq.includes('30 day') || lq.includes('month');
  const wantsWeekly = lq.includes('weekly') || lq.includes('7d') || lq.includes('7 day') || lq.includes('week');
  const wantsYearly = lq.includes('yearly') || lq.includes('1y') || lq.includes('365d') || lq.includes('year');

  let targetCoinForChange: CryptoCoin | undefined = coins.find(c => {
    const sym = c.symbol.toLowerCase(); const name = c.name.toLowerCase();
    return lq.includes(sym) || lq.includes(name);
  });
  if(!targetCoinForChange && lq.includes('its') || lq.includes('it ') || lq.includes('that coin')){
    targetCoinForChange = lastCoinObj || undefined;
  }

  if(targetCoinForChange && (wantsMonthly || wantsWeekly || wantsYearly)){
    const c = targetCoinForChange;
    const change7 = (c as any).price_change_percentage_7d_in_currency;
    const change30 = (c as any).price_change_percentage_30d_in_currency;
    const change1y = (c as any).price_change_percentage_1y_in_currency;
    if(wantsWeekly && change7 !== undefined) return `${c.name} (${c.symbol.toUpperCase()}) weekly change: ${change7?.toFixed(2)}%. Price $${c.current_price?.toLocaleString()}. 24h ${c.price_change_percentage_24h?.toFixed(2)}%.\nMarket cap rank #${c.market_cap_rank}.\nNot financial advice.`;
    if(wantsMonthly && change30 !== undefined) return `${c.name} (${c.symbol.toUpperCase()}) monthly change: ${change30?.toFixed(2)}%. Price $${c.current_price?.toLocaleString()}. 24h ${c.price_change_percentage_24h?.toFixed(2)}%.\nMarket cap rank #${c.market_cap_rank}.\nNot financial advice.`;
    if(wantsYearly && change1y !== undefined) return `${c.name} (${c.symbol.toUpperCase()}) yearly change: ${change1y?.toFixed(2)}%. Price $${c.current_price?.toLocaleString()}.\nMarket cap rank #${c.market_cap_rank}.\nNot financial advice.`;
  }

  try {
    let qForApi = cleanQ;
    if(lastCoinSymbol && /\b(its|it|that coin)\b/i.test(cleanQ) && !lq.includes(lastCoinSymbol.toLowerCase())){
      qForApi = `${lastCoinSymbol} ${cleanQ}`;
    }
    const hist = _extHistory || orbHistory.slice(-5);
    const res = await fetch('/api/ask-orb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: qForApi, coins, history: hist, lastCoin: lastCoinSymbol }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.text?.trim()) {
        orbHistory.push({role:'user', text: cleanQ});
        orbHistory.push({role:'assistant', text: data.text.trim()});
        if(orbHistory.length>10) orbHistory=orbHistory.slice(-10);
        const t = data.text.trim();
        if (!/busy|timeout|aborted|high demand|not available/i.test(t.slice(0, 80))) return t;
      }
    }
  } catch (err) { console.warn('AI unavailable, using local fallback'); }

  const btc = coins.find(c => c.symbol.toLowerCase() === 'btc') || coins[0];
  const sortedByChange = [...coins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  const topGainers = sortedByChange.slice(0, 3);
  const avgChange = coins.reduce((acc, c) => acc + (c.price_change_percentage_24h || 0), 0) / (coins.length || 1);
  const matchedCoin = targetCoinForChange || coins.find(c => lq.includes(c.symbol.toLowerCase()) || lq.includes(c.name.toLowerCase()));

  if (matchedCoin) {
    const isUp = (matchedCoin.price_change_percentage_24h ?? 0) >= 0;
    return `${matchedCoin.name} (${matchedCoin.symbol.toUpperCase()}) is trading at $${matchedCoin.current_price?.toLocaleString()} with 24h ${isUp ? '+' : ''}${matchedCoin.price_change_percentage_24h?.toFixed(2)}%.\nRank #${matchedCoin.market_cap_rank} cap ${formatCompact(matchedCoin.market_cap)}. Volume ${formatCompact(matchedCoin.total_volume)}.\nRange $${matchedCoin.low_24h?.toLocaleString()} - $${matchedCoin.high_24h?.toLocaleString()}.\nNot financial advice.`;
  }

  return `Top 100 avg 24h: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%. BTC $${btc?.current_price?.toLocaleString()}.\nTop gainer ${topGainers[0]?.name} +${topGainers[0]?.price_change_percentage_24h?.toFixed(1)}%.\nTotal volume ${formatCompact(coins.reduce((a,c)=>a+(c.total_volume||0),0))}.\nNot financial advice.`;
}
