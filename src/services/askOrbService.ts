import { CryptoCoin } from '../types/crypto';

let orbHistory: {role: 'user'|'assistant', text: string}[] = [];

function getLastCoinFromHistory(coins: CryptoCoin[]): CryptoCoin | null {
  for(let i=orbHistory.length-1;i>=0;i--){
    const t=orbHistory[i].text.toLowerCase();
    for(const c of coins){
      const name = c.name.toLowerCase();
      const id = c.id.toLowerCase();
      const sym = c.symbol.toLowerCase();
      if (t.includes(name) || t.includes(id) || new RegExp(`\\b${sym}\\b`).test(t)) {
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

export async function askOrbAssistant(question: string, coins: CryptoCoin[]): Promise<string> {
  const cleanQ = question.trim();
  if (!cleanQ) return 'Please enter a question.\nNot financial advice.';
  const lq = cleanQ.toLowerCase();

  if (/(will.*pump|will.*go high|should i buy|do i buy|buy them|which.*will.*pump|profit|can it go|will it go|go down.*next|go high.*next|should.*buy|buy.*or not|but.*doge)/i.test(lq) && (lq.includes('buy') || lq.includes('pump') || lq.includes('go high') || lq.includes('go down') || lq.includes('but'))) {
    if(lq.includes('buy') || lq.includes('pump') || lq.includes('go high') || lq.includes('go down') || lq.includes('but')){
      return `I cannot predict future prices or give buying advice. I only provide current data: price, 24h/7d/30d/1y changes, market cap.\nTell me which coin you want.\nNot financial advice.`;
    }
  }

  if (['hi','hey','hello','yo','sup','howdy','hey orb','hi orb'].includes(lq)) return "Hi! I'm Orb, your live crypto assistant.\nAsk me about any coin, market movers, or 24h stats.\nNot financial advice.";

  const lastCoinObj = getLastCoinFromHistory(coins);
  const STOP = new Set(['coin','coins','about','what','whats','what\'s','s','the','this','that','then']);
  const qTokens = lq.split(/[^a-z0-9]+/).filter(w=>w.length>2 && !STOP.has(w));

  let targetCoin: CryptoCoin | undefined = coins.find(c => {
    const sym = c.symbol.toLowerCase();
    return new RegExp(`\\b${sym}\\b`).test(lq);
  });
  if(!targetCoin){
    targetCoin = coins.find(c => {
      const name = c.name.toLowerCase();
      const id = c.id.toLowerCase();
      for(const tok of qTokens){
        if(tok.length<3) continue;
        if(name.includes(tok) || id.includes(tok)) return true;
      }
      return false;
    });
  }
  if(lq.includes('its') || lq.includes('that coin')){
    if(lastCoinObj) targetCoin = lastCoinObj;
  }

  if(lq.includes('top') && (lq.includes('gainer') || lq.includes('loser') || lq.includes('ganier') || lq.includes('looser'))){
    const isLoser = lq.includes('loser') || lq.includes('looser');
    const wantsWeek = lq.includes('week') || lq.includes('7d');
    const wantsMonth = lq.includes('month') || lq.includes('30d');
    const wantsYear = lq.includes('year') || lq.includes('1y') || lq.includes('365d');
    const wants10 = lq.includes('10');
    let sorted = [...coins];
    if(wantsMonth){
      sorted.sort((a,b)=> {
        const av = (a as any).price_change_percentage_30d_in_currency || 0;
        const bv = (b as any).price_change_percentage_30d_in_currency || 0;
        return isLoser ? av - bv : bv - av;
      });
    } else if(wantsWeek){
      sorted.sort((a,b)=> {
        const av = (a as any).price_change_percentage_7d_in_currency || 0;
        const bv = (b as any).price_change_percentage_7d_in_currency || 0;
        return isLoser ? av - bv : bv - av;
      });
    } else if(wantsYear){
      sorted.sort((a,b)=> {
        const av = (a as any).price_change_percentage_1y_in_currency || 0;
        const bv = (b as any).price_change_percentage_1y_in_currency || 0;
        return isLoser ? av - bv : bv - av;
      });
    } else {
      sorted.sort((a,b)=> isLoser ? (a.price_change_percentage_24h||0) - (b.price_change_percentage_24h||0) : (b.price_change_percentage_24h||0) - (a.price_change_percentage_24h||0));
    }
    const count = wants10 ? 10 : 5;
    const top = sorted.slice(0,count);
    let period = '24h';
    if(wantsMonth) period = '30d';
    if(wantsWeek) period = '7d';
    if(wantsYear) period = '1y';
    const type = isLoser ? 'losers' : 'gainers';
    const list = top.map((c,i)=> `${i+1}. ${c.name} (${c.symbol.toUpperCase()}) ${wantsMonth ? (c as any).price_change_percentage_30d_in_currency?.toFixed(1) : wantsWeek ? (c as any).price_change_percentage_7d_in_currency?.toFixed(1) : wantsYear ? (c as any).price_change_percentage_1y_in_currency?.toFixed(1) : c.price_change_percentage_24h?.toFixed(1)}%`).join(', ');
    return `Top ${count} ${type} in last ${period}: ${list}.\nPrices live from CoinGecko.\nNot financial advice.`;
  }

  if(lq.includes('which coin') && (lq.includes('goes up') || lq.includes('up in last') || lq.includes('trending'))){
    const sorted = [...coins].sort((a,b)=>(b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0));
    const gainer = sorted[0];
    return `${gainer.name} (${gainer.symbol.toUpperCase()}) is trending up +${gainer.price_change_percentage_24h?.toFixed(2)}% in last 24h. Price $${gainer.current_price?.toLocaleString()}.\nTotal volume ${formatCompact(coins.reduce((a,c)=>a+(c.total_volume||0),0))}.\nNot financial advice.`;
  }

  const wantsMonthly = lq.includes('monthly') || lq.includes('30d') || lq.includes('month');
  const wantsWeekly = lq.includes('weekly') || lq.includes('7d') || lq.includes('week');
  const wantsYearly = lq.includes('yearly') || lq.includes('1y') || lq.includes('365d') || lq.includes('year');
  if(targetCoin && (wantsMonthly || wantsWeekly || wantsYearly)){
    const c = targetCoin;
    const ch7 = (c as any).price_change_percentage_7d_in_currency;
    const ch30 = (c as any).price_change_percentage_30d_in_currency;
    const ch1y = (c as any).price_change_percentage_1y_in_currency;
    if(wantsWeekly) return `${c.name} (${c.symbol.toUpperCase()}) weekly: ${ch7?.toFixed(2)}%. Price $${c.current_price?.toLocaleString()}. 24h ${c.price_change_percentage_24h?.toFixed(2)}%.\nRank #${c.market_cap_rank}.\nNot financial advice.`;
    if(wantsMonthly) return `${c.name} (${c.symbol.toUpperCase()}) monthly: ${ch30?.toFixed(2)}%. Price $${c.current_price?.toLocaleString()}.\nRank #${c.market_cap_rank}.\nNot financial advice.`;
    if(wantsYearly) return `${c.name} (${c.symbol.toUpperCase()}) yearly: ${ch1y?.toFixed(2)}%. Price $${c.current_price?.toLocaleString()}.\nRank #${c.market_cap_rank}.\nNot financial advice.`;
  }

  if(lq.includes('hamster')){
    return `Hamster Kombat (HMSTR) is not in my current Top 100 list (it's rank ~300+). I track Top 100 live from CoinGecko.\nTop gainer now is ${[...coins].sort((a,b)=>(b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0))[0].name} +${[...coins].sort((a,b)=>(b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0))[0].price_change_percentage_24h?.toFixed(1)}%.\nNot financial advice.`;
  }

  try {
    let qForApi = cleanQ;
    if(lastCoinObj && /\b(its|that coin)\b/i.test(cleanQ)){
      qForApi = `${lastCoinObj.symbol} ${cleanQ}`;
    }
    const res = await fetch('/api/ask-orb', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: qForApi, coins: targetCoin ? [targetCoin, ...coins.slice(0,4)] : coins.slice(0,5), history: orbHistory.slice(-5), lastCoin: lastCoinObj?.symbol || '' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.text?.trim()) {
        orbHistory.push({role:'user', text: cleanQ});
        orbHistory.push({role:'assistant', text: data.text.trim()});
        if(orbHistory.length>10) orbHistory=orbHistory.slice(-10);
        return data.text.trim();
      }
    }
  } catch {}

  if(targetCoin){
    return `${targetCoin.name} (${targetCoin.symbol.toUpperCase()}) is $${targetCoin.current_price?.toLocaleString()} 24h ${targetCoin.price_change_percentage_24h?.toFixed(2)}%.\nCap ${formatCompact(targetCoin.market_cap)} rank #${targetCoin.market_cap_rank}.\nNot financial advice.`;
  }
  const btc = coins.find(c=>c.symbol.toLowerCase()==='btc') || coins[0];
  return `Top 100 avg 24h ${(coins.reduce((a,c)=>a+(c.price_change_percentage_24h||0),0)/coins.length).toFixed(2)}%. BTC $${btc?.current_price?.toLocaleString()}.\nNot financial advice.`;
}
