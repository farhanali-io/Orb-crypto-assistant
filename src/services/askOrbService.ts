import type { CryptoCoin } from "../types/crypto";

type Timeframe = "1h" | "24h" | "7d" | "30d" | "1y";
const TIMEFRAME_FIELDS: Record<Timeframe, keyof CryptoCoin> = {
  "1h": "price_change_percentage_1h_in_currency",
  "24h": "price_change_percentage_24h",
  "7d": "price_change_percentage_7d_in_currency",
  "30d": "price_change_percentage_30d_in_currency",
  "1y": "price_change_percentage_1y_in_currency",
};
const MAX_RESULTS = 5;
function isAvailable(v: unknown): v is number { return typeof v === "number" && Number.isFinite(v); }
function formatPrice(v: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 8 : 2 }).format(v); }
function formatCompact(v: number): string { return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(v); }
function formatPercent(v: number): string { return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`; }
function coinName(c: CryptoCoin): string { return `${c.name} (${c.symbol.toUpperCase()})`; }
function timeframeLabel(t: Timeframe): string { return { "1h": "1 hour", "24h": "24 hours", "7d": "7 days", "30d": "30 days", "1y": "1 year" }[t]; }
function getChange(c: CryptoCoin, t: Timeframe): number | null { const v = c[TIMEFRAME_FIELDS[t]]; return isAvailable(v) ? v : null; }
function unavailable(): string { return "That information is not available right now in Orb's data."; }
function escapeRegex(v: string): string { return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function isGreeting(q: string): boolean { const s = q.trim().toLowerCase().replace(/[!?.]+/g, " ").replace(/\s+/g, " ").trim(); return /^(hi|hey|hello|hii+|heyy+|salam|assalam(?:ualaikum)?|asalam(?:ualaikum)?|aoa|good morning|good afternoon|good evening|how are you|how r u|how're you|what's up|whats up|hey how are you|hi how are you|hello how are you|hey how r u|hey whats up|hi whats up)$/i.test(s); }
function getGreeting(q: string): string {
  const l = q.toLowerCase();
  if (/salam|assalam|aoa/.test(l)) return "Wa Alaikum Assalam! Hey! 👋 What would you like to explore on Orb today?";
  if (/how are you|how r u|how're you/.test(l)) return "I'm doing great, thanks for asking! 😄 What crypto would you like to check today?";
  if (/good morning/.test(l)) return "Good morning! ☀️ Ready to explore the crypto market?";
  if (/good evening/.test(l)) return "Good evening! Hey! What are we checking in the crypto market today?";
  return "Hey! 👋 Welcome to Orb. Want to check coin prices, rankings, gainers or explore the bubbles?";
}
function detectTimeframe(q: string): Timeframe {
  const l = q.toLowerCase();
  if (/\b(1h|1 hour|one hour|hourly|last hour)\b/.test(l)) return "1h";
  if (/\b(1y|1 year|one year|yearly|annual|last year|past year|12 months)\b/.test(l)) return "1y";
  if (/\b(30d|30 days|30-day|last month|past month|monthly|one month)\b/.test(l)) return "30d";
  if (/\b(7d|7 days|7-day|weekly|last week|past week|one week)\b/.test(l)) return "7d";
  return "24h";
}
function findMentionedCoins(question: string, coins: CryptoCoin[]): CryptoCoin[] {
  const q = question.toLowerCase();
  const matches = coins.filter((coin) => {
    const symbol = coin.symbol.toLowerCase();
    const name = coin.name.toLowerCase();
    const symbolRegex = new RegExp(`(^|[^a-z0-9])${escapeRegex(symbol)}([^a-z0-9]|$)`, "i");
    return symbolRegex.test(q) || new RegExp(`\\b${escapeRegex(name)}\\b`, "i").test(q);
  });
  return matches.filter((coin, i, arr) => arr.findIndex((x) => x.id === coin.id) === i);
}
function answerRank(question: string, coins: CryptoCoin[]): string | null {
  const match = question.match(/\b(?:at\s+)?rank\s*#?\s*(\d+)\b|\b#(\d+)\b/i);
  if (!match) return null;
  const rank = Number(match[1] || match[2]);
  if (!Number.isInteger(rank) || rank < 1) return null;
  const coin = coins.find((x) => x.market_cap_rank === rank);
  if (!coin) return `I couldn't find a coin at rank #${rank} in Orb's current data.`;
  return [`Nice! Here's the coin at **rank #${rank}**:`, `- **${coin.name} (${coin.symbol.toUpperCase()})**`, `- Price: ${isAvailable(coin.current_price) ? formatPrice(coin.current_price) : "Not available right now"}`, `- Market cap: ${isAvailable(coin.market_cap) ? `$${formatCompact(coin.market_cap)}` : "Not available right now"}`].join("\n");
}
function answerCoinInfo(coin: CryptoCoin, question: string): string {
  const q = question.toLowerCase();
  const timeframe = detectTimeframe(question);
  const asksChange = /change|performance|return|gain|gained|loss|lost|up|down|percentage|percent|1h|24h|7d|30d|1y|last month|last year|last week|last hour/i.test(q);
  const asksPrice = /price|cost|worth|value/i.test(q);
  const asksRank = /rank|position|ranking/i.test(q);
  const asksMarketCap = /market cap|market capitalization/i.test(q);
  const asksVolume = /volume|trading activity|traded/i.test(q);
  const lines = [`**${coinName(coin)}**`];
  if (asksPrice || (!asksRank && !asksMarketCap && !asksVolume && !asksChange)) lines.push(`- Price: ${isAvailable(coin.current_price) ? formatPrice(coin.current_price) : "Not available right now"}`);
  if (asksRank || (!asksPrice && !asksMarketCap && !asksVolume && !asksChange)) lines.push(`- Rank: ${isAvailable(coin.market_cap_rank) ? `#${coin.market_cap_rank}` : "Not available right now"}`);
  if (asksMarketCap) lines.push(`- Market cap: ${isAvailable(coin.market_cap) ? `$${formatCompact(coin.market_cap)}` : "Not available right now"}`);
  if (asksVolume) lines.push(`- 24h volume: ${isAvailable(coin.total_volume) ? `$${formatCompact(coin.total_volume)}` : "Not available right now"}`);
  if (asksChange) { const ch = getChange(coin, timeframe); lines.push(`- ${timeframeLabel(timeframe)} change: ${ch !== null ? formatPercent(ch) : "Not available right now"}`); }
  return lines.join("\n");
}
function answerMovers(coins: CryptoCoin[], timeframe: Timeframe, losers: boolean): string {
  const sorted = coins.map((coin) => ({ coin, change: getChange(coin, timeframe) })).filter((x): x is { coin: CryptoCoin; change: number } => x.change !== null).filter((x) => (losers ? x.change < 0 : x.change > 0)).sort((a, b) => (losers ? a.change - b.change : b.change - a.change)).slice(0, MAX_RESULTS);
  if (!sorted.length) return `No ${losers ? "losers" : "gainers"} with available ${timeframeLabel(timeframe)} data right now.`;
  const heading = losers ? `📉 **Top losers — ${timeframeLabel(timeframe)}**` : `🚀 **Top gainers — ${timeframeLabel(timeframe)}**`;
  return [heading, ...sorted.map(({ coin, change }, i) => `${i + 1}. **${coin.name} (${coin.symbol.toUpperCase()})** — ${formatPercent(change)}`)].join("\n");
}
function answerTopCoins(coins: CryptoCoin[], question: string): string {
  const cheapest = /cheapest|lowest price|least expensive/i.test(question);
  const sorted = [...coins].filter((c) => isAvailable(cheapest ? c.current_price : c.market_cap_rank)).sort((a, b) => (cheapest ? a.current_price - b.current_price : a.market_cap_rank - b.market_cap_rank)).slice(0, MAX_RESULTS);
  if (!sorted.length) return unavailable();
  return [(cheapest ? "**Cheapest coins in Orb:**" : "**Top coins by market-cap rank:**"), ...sorted.map((coin, i) => `${i + 1}. **${coinName(coin)}** — ${cheapest ? formatPrice(coin.current_price) : `Rank #${coin.market_cap_rank}`}`)].join("\n");
}
function answerBiggestCoins(coins: CryptoCoin[]): string {
  const sorted = [...coins].filter((c) => isAvailable(c.market_cap)).sort((a, b) => b.market_cap - a.market_cap).slice(0, MAX_RESULTS);
  if (!sorted.length) return unavailable();
  return ["**Biggest coins by market cap:**", ...sorted.map((coin, i) => `${i + 1}. **${coinName(coin)}** — $${formatCompact(coin.market_cap)}`)].join("\n");
}
function answerComparison(coins: CryptoCoin[], question: string): string | null {
  const mentioned = findMentionedCoins(question, coins);
  if (!/\b(vs|versus|compare|comparison|better than)\b/i.test(question)) return null;
  if (mentioned.length >= 3) {
    const ordered3 = [...mentioned].sort((a, b) => {
      const pos = (coin: CryptoCoin) => { const qq = question.toLowerCase(); const ps = [qq.indexOf(coin.symbol.toLowerCase()), qq.indexOf(coin.name.toLowerCase())].filter((pp) => pp >= 0); return ps.length ? Math.min(...ps) : 9999; };
      return pos(a) - pos(b);
    });
    const three = ordered3.slice(0, 3);
    const timeframe = detectTimeframe(question);
    const syms = three.map((c) => c.symbol.toUpperCase());
    const header = `**${syms.join(" vs ")}**`;
    const tableHead = `| Metric | ${syms.join(" | ")} |`;
    const sep = `|---|${"---:|".repeat(three.length)}`;
    const rowPrice = `| Price | ${three.map((c) => isAvailable(c.current_price) ? formatPrice(c.current_price) : "N/A").join(" | ")} |`;
    const rowCap = `| Market cap | ${three.map((c) => isAvailable(c.market_cap) ? "$" + formatCompact(c.market_cap) : "N/A").join(" | ")} |`;
    const rowRank = `| Rank | ${three.map((c) => isAvailable(c.market_cap_rank) ? "#" + c.market_cap_rank : "N/A").join(" | ")} |`;
    const rowChg = `| ${timeframeLabel(timeframe)} | ${three.map((c) => getChange(c, timeframe) !== null ? formatPercent(getChange(c, timeframe)!) : "N/A").join(" | ")} |`;
    return [header, tableHead, sep, rowPrice, rowCap, rowRank, rowChg].join("\n");
  }
  if (mentioned.length < 2) return "Tell me the two coin symbols you'd like to compare, such as BTC vs ETH.";
  const ordered = [...mentioned].sort((a, b) => {
    const pos = (coin: CryptoCoin) => { const q = question.toLowerCase(); const ps = [q.indexOf(coin.symbol.toLowerCase()), q.indexOf(coin.name.toLowerCase())].filter((p) => p >= 0); return ps.length ? Math.min(...ps) : 9999; };
    return pos(a) - pos(b);
  });
  const [first, second] = ordered.slice(0, 2);
  const timeframe = detectTimeframe(question);
  return [`**${first.symbol.toUpperCase()} vs ${second.symbol.toUpperCase()}**`, `| Metric | ${first.symbol.toUpperCase()} | ${second.symbol.toUpperCase()} |`, `|---|---:|---:|`, `| Price | ${isAvailable(first.current_price) ? formatPrice(first.current_price) : "N/A"} | ${isAvailable(second.current_price) ? formatPrice(second.current_price) : "N/A"} |`, `| Market cap | ${isAvailable(first.market_cap) ? `$${formatCompact(first.market_cap)}` : "N/A"} | ${isAvailable(second.market_cap) ? `$${formatCompact(second.market_cap)}` : "N/A"} |`, `| Rank | ${isAvailable(first.market_cap_rank) ? `#${first.market_cap_rank}` : "N/A"} | ${isAvailable(second.market_cap_rank) ? `#${second.market_cap_rank}` : "N/A"} |`, `| ${timeframeLabel(timeframe)} | ${getChange(first, timeframe) !== null ? formatPercent(getChange(first, timeframe)!) : "N/A"} | ${getChange(second, timeframe) !== null ? formatPercent(getChange(second, timeframe)!) : "N/A"} |`].join("\n");
}
function answerSiteHelp(question: string): string | null {
  const q = question.toLowerCase();
  if (/\b(what is orb|what's orb|tell me about orb|about orb|what does orb do)\b/i.test(q)) return ["**Hey! Welcome to Orb. 👋**", "Orb is a cryptocurrency market visualization platform.", "- **Bubbles:** Explore coins visually. Bigger bubbles represent larger market caps.", "- **Tables:** Browse and sort coins by rank, price, 24h change and trading volume.", "- **Ask Orb:** Ask about prices, rankings, performance and market comparisons.", "Orb retrieves market data from CoinGecko when available, with CoinCap and cached data as fallbacks. Data freshness depends on the available feed. This is not financial advice."].join("\n");
  if (/\b(bubbles?|bubble view|bubble size|bubbles work|bubbles mean)\b/i.test(q) && /\b(what|how|explain|work|mean|size|show)\b/i.test(q)) return ["**Bubbles view** makes the crypto market visual!", "- Each bubble represents a cryptocurrency.", "- Bubble size represents its market capitalization.", "- Bigger bubble = larger market cap.", "- Explore the bubbles to discover and compare coins."].join("\n");
  if (/\b(tables?|table view|sort|sorting)\b/i.test(q) && /\b(what|how|explain|work|use|show)\b/i.test(q)) return ["**Tables view** gives you a structured look at the market.", "- Sort coins by market rank.", "- Compare prices and 24h changes.", "- Check 24h trading volume.", "Switch to Tables when you want to compare exact numbers."].join("\n");
  if (/\b(ask orb|how to use orb|how do i use orb|how to ask)\b/i.test(q)) return ["**Using Ask Orb is easy!**", "Just type what you want to know.", "- Ask about a coin: `BTC price`", "- Check rankings: `Which coin is rank 10?`", "- Find movers: `Top gainers last month`", "- Compare: `BTC vs ETH last year`"].join("\n");
  if (/\b(not financial advice|financial advice|investment advice)\b/i.test(q)) return "Orb provides cryptocurrency market information for educational purposes. It is not financial advice. Always do your own research before making financial decisions.";
  return null;
}
function answerSiteIssue(question: string): string | null {
  const q = question.toLowerCase();
  if (!/\b(not loading|not load|not showing|disappeared|blank|broken|not working|stuck|slow|error|wrong data|incorrect data|not updating|frozen|failed|crash|crashing)\b/i.test(q)) return null;
  if (/\b(bubble|bubbles)\b/i.test(q)) return ["Got it! Let's troubleshoot the Bubbles view.", "- Refresh the page.", "- Check your internet connection.", "- Try switching to Tables and back to Bubbles.", "- If it still fails, the market-data request may be having trouble.", "I can't inspect your browser directly, so I can't confirm the cause."].join("\n");
  if (/\b(price|data|market|coin|updating)\b/i.test(q)) return ["Got it! Let's check the market data.", "- Refresh Orb to request the latest available data.", "- Check whether other coins are updating.", "- CoinGecko data may sometimes be delayed or unavailable.", "I can't inspect the live API connection from this chat."].join("\n");
  return ["Got it! Let's try a quick fix.", "- Refresh Orb.", "- Check your internet connection.", "- Try again in a moment.", "If it continues, tell me what you're seeing."].join("\n");
}
function answerMarketSummary(coins: CryptoCoin[]): string {
  const valid = coins.map((coin) => ({ coin, change: getChange(coin, "24h") })).filter((x): x is { coin: CryptoCoin; change: number } => x.change !== null);
  if (!valid.length) return unavailable();
  const gainers = valid.filter((x) => x.change > 0).length;
  const losers = valid.filter((x) => x.change < 0).length;
  const strongest = [...valid].sort((a, b) => b.change - a.change)[0];
  const weakest = [...valid].sort((a, b) => a.change - b.change)[0];
  const mood = gainers > losers ? "More tracked coins are up than down." : losers > gainers ? "More tracked coins are down than up." : "The tracked coins are evenly split between gains and losses.";
  return ["**Here's your Orb market snapshot!**", `- Coins with available 24h data: ${valid.length}`, `- Gainers: ${gainers}`, `- Losers: ${losers}`, `- Biggest gainer: ${coinName(strongest.coin)} (${formatPercent(strongest.change)})`, `- Biggest loser: ${coinName(weakest.coin)} (${formatPercent(weakest.change)})`, `_${mood}_`].join("\n");
}
function answerEducation(q: string): string | null {
  const l = q.toLowerCase();
  if (/\b(what (does|is)|what's|explain|meaning of|define|definition of)\b/i.test(q) && /\b(market cap|market capitalization)\b/i.test(l)) return ["**Market cap** = price x total coins in circulation.", "- It shows how big a coin is compared to others.", "- Example: if a coin costs $10 and has 1M coins, its market cap is $10M.", "- Bigger market cap usually means a more established coin, but it is not a guarantee of safety."].join("\n");
  if (/\b(what (does|is)|what's|explain|meaning of|define)\b/i.test(q) && /\b(volume|trading volume)\b/i.test(l)) return "**Trading volume** is how much of a coin was bought and sold in 24 hours. Higher volume usually means more people are actively trading it.";
  if (/\b(what (does|is)|what's|explain|meaning of|define)\b/i.test(q) && /\b(bitcoin|btc)\b/i.test(l)) return "**Bitcoin (BTC)** was the first cryptocurrency, created in 2009. It is often called digital gold because its supply is limited to 21 million coins.";
  if (/\b(what (does|is)|what's|explain|meaning of|define)\b/i.test(q) && /\b(blockchain)\b/i.test(l)) return "**Blockchain** is a shared, tamper-resistant ledger that records transactions across many computers. That is what makes crypto work without a single central bank.";
  if (/\b(what (does|is)|what's|explain)\b/i.test(q) && /\b(crypto|cryptocurrency)\b/i.test(l)) return "**Crypto** is digital money secured by cryptography and recorded on a blockchain. Prices move fast, so always do your own research. This is not financial advice.";
  return null;
}
function isClearlyOffTopic(q: string): boolean { return /\b(weather|capital of|president of|recipe|football|soccer|cricket|homework|math problem|write me a poem|translate this|who won the election|movie recommendation)\b/i.test(q); }
function buildCompareTable(list: any[], label: string, field: string) {
  const fmtPct = (c) => { const v = c[field]; if (typeof v !== 'number' || !Number.isFinite(v)) return 'N/A'; return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'; };
  const syms = list.map((c) => c.symbol.toUpperCase());
  const header = '| Metric | ' + syms.join(' | ') + ' |';
  const sep = '|---|' + '---:|'.repeat(list.length);
  const rowPrice = '| Price | ' + list.map((c) => '$' + Number(c?.current_price ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 8})).join(' | ') + ' |';
  const rowCap = '| Market cap | ' + list.map((c) => { try { return formatMarketCap(c?.market_cap ?? 0); } catch(e) { return '$' + Number(c?.market_cap ?? 0).toLocaleString(); } }).join(' | ') + ' |';
  const rowRank = '| Rank | ' + list.map((c) => '#' + (c?.market_cap_rank ?? 'N/A')).join(' | ') + ' |';
  const rowChg = '| ' + label + ' | ' + list.map(fmtPct).join(' | ') + ' |';
  const titles = list.map((c) => c.name + ' (' + c.symbol.toUpperCase() + ')').join(' vs ');
  return '**' + titles + '**\n\n' + header + '\n' + sep + '\n' + rowPrice + '\n' + rowCap + '\n' + rowRank + '\n' + rowChg;
}



export async function askOrbAssistant(question: string, coins: CryptoCoin[]): Promise<string> {
  try {
    const q = question.trim();
    if (!q) return "Hey! What would you like to explore on Orb?";
    if (!Array.isArray(coins) || coins.length === 0) return "Hey! Orb's coin data isn't available right now. Please refresh and try again.";
    if (isGreeting(q)) return getGreeting(q);
    const siteHelp = answerSiteHelp(q); if (siteHelp) return siteHelp;
    const siteIssue = answerSiteIssue(q); if (siteIssue) return siteIssue;
    if (/\b(how many|number of|count of|total)\b.*\b(coins|cryptocurrencies|crypto)\b/i.test(q) || /\b(how many coins|coin count)\b/i.test(q)) return `Orb currently has **${coins.length} coins** in the dataset supplied to this chat. Want to explore the top gainers?`;
    const rankAnswer = answerRank(q, coins); if (rankAnswer) return rankAnswer;
    if (/\b(gainers?|winners?|losers?|decliners?)\b/i.test(q)) { const tf = detectTimeframe(q); const losers = /\b(losers?|decliners?|worst|biggest drops|falling|down the most)\b/i.test(q); return answerMovers(coins, tf, losers); }
    const comparison = answerComparison(coins, q); if (comparison) return comparison;
    if (/\b(biggest|largest|highest market cap)\b/i.test(q)) return answerBiggestCoins(coins);
    if (/\b(cheapest|lowest price|least expensive)\b/i.test(q)) return answerTopCoins(coins, q);
    if (/\b(top coins|top cryptocurrencies|top crypto|best ranked coins)\b/i.test(q)) return answerTopCoins(coins, q);
    if (/\b(market today|crypto market|market doing|market looking|market summary|market overview|overall market|how is market|how's market)\b/i.test(q)) return answerMarketSummary(coins);
    const edu = answerEducation(q); if (edu) return edu;
    const mentioned = findMentionedCoins(q, coins);
    if (mentioned.length === 1) return answerCoinInfo(mentioned[0], q);
    if (mentioned.length > 1) return "I found multiple coins in your question. Which one would you like me to check?";
    const looksLikeCoinSearch = (/\b(price|rank|volume|change|performance)\b/i.test(q) || /\b(what is|what\'s|tell me|show me|give me|how much is|price of|how much)\b[^?]*\b(coin|token|crypto)\b/i.test(q)) && !/\b(interesting|something|anything|mean|means|explain|what is crypto|what is blockchain)\b/i.test(q);
    if (looksLikeCoinSearch) return "Not in Orb's top 100, it might be unlisted.";
    if (isClearlyOffTopic(q)) return "Hey! I only help with crypto on Orb. Want to check coin prices, rankings, gainers or compare cryptocurrencies?";
    return ["Hey! I'm Orb, your crypto buddy. 👋", "Here are some things I can help with:", "- Coin prices, ranks and market caps", "- Top gainers and losers (1h, 24h, 7d, 30d, 1y)", "- BTC vs ETH comparisons", "- Market summaries and Orb website help", "What shall we explore?"].join("\n");
  } catch (e) { console.error("Ask Orb error:", e); return "Oops! Something went wrong while checking Orb's data. Give it another try!"; }
}
export const askOrb = askOrbAssistant;
export default askOrbAssistant;
