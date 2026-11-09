import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Mount JSON parser specifically for /api routes
app.use('/api', express.json({ limit: '10mb' }));

app.get('/api/test', (_req, res) => {
  res.json({ status: 'ok' });
});

// Helper to format currency/numbers for compact display
function formatCompact(val?: number): string {
  if (!val) return '0';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

// Server-side deterministic live CoinGecko calculation
function computeServerFallback(cleanQ: string, ctx: any): string {
  const q = cleanQ.toLowerCase();

  // Top Gainers?
  if (q.includes('top gainer') || q.includes('gainers') || q.includes('who is up') || q.includes('best coin')) {
    const g1 = ctx.topGainers[0];
    const g2 = ctx.topGainers[1];
    const g3 = ctx.topGainers[2];
    const line1 = `Today's top gainers are ${g1?.name || 'Token'} (+${(g1?.price_change_percentage_24h ?? 0).toFixed(1)}%), ${g2?.name || 'Token'} (+${(g2?.price_change_percentage_24h ?? 0).toFixed(1)}%), and ${g3?.name || 'Token'} (+${(g3?.price_change_percentage_24h ?? 0).toFixed(1)}%).`;
    const line2 = `These coins lead market momentum while the Top 100 average 24h change is ${ctx.avgChange >= 0 ? '+' : ''}${ctx.avgChange.toFixed(2)}%.`;
    const line3 = `Their bubbles glow bright green on Orbix reflecting strong upward buy volume.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  // Why BTC down / up?
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

  // What is Market Cap?
  if (q.includes('market cap') || q.includes('market capitalization') || q.includes('what is cap')) {
    const line1 = `Market capitalization represents a cryptocurrency's current price multiplied by its total circulating supply.`;
    const line2 = `The combined market cap of the Top 100 coins currently stands at ${formatCompact(ctx.totalMarketCap)}.`;
    const line3 = `On Orbix, bubble sizes directly scale with market cap so higher-valued coins appear larger.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  // Matched coin
  if (ctx.matchedCoin) {
    const coin = ctx.matchedCoin;
    const isUp = (coin.price_change_percentage_24h ?? 0) >= 0;
    const line1 = `${coin.name} (${coin.symbol.toUpperCase()}) is trading at $${coin.current_price?.toLocaleString() || '0'} with a 24-hour change of ${isUp ? '+' : ''}${(coin.price_change_percentage_24h ?? 0).toFixed(2)}%.`;
    const line2 = `It holds market cap rank #${coin.market_cap_rank || '—'} with a total market valuation of ${formatCompact(coin.market_cap)}.`;
    const line3 = `Its 24-hour trading volume is ${formatCompact(coin.total_volume)}, with today's range between $${coin.low_24h?.toLocaleString() || 'N/A'} and $${coin.high_24h?.toLocaleString() || 'N/A'}.`;
    return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
  }

  // General Market Overview
  const line1 = `The Top 100 cryptocurrency market currently averages a ${ctx.avgChange >= 0 ? '+' : ''}${ctx.avgChange.toFixed(2)}% move across the board today.`;
  const line2 = `Bitcoin (BTC) anchors the market at $${ctx.btc?.current_price?.toLocaleString() || 'N/A'}, while ${ctx.topGainers[0]?.name || 'gainers'} leads top momentum.`;
  const line3 = `Total 24-hour tracked volume stands at ${formatCompact(ctx.totalVolume)}.`;
  return `${line1}\n${line2}\n${line3}\nNot financial advice.`;
}

function buildMarketSummary(coins: any[], cleanQ: string) {
  const coinList = Array.isArray(coins) ? coins : [];
  const btc = coinList.find((c: any) => c.symbol?.toLowerCase() === 'btc') || coinList[0];
  const eth = coinList.find((c: any) => c.symbol?.toLowerCase() === 'eth') || coinList[1];

  const sortedByChange = [...coinList].sort(
    (a: any, b: any) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
  );
  const topGainers = sortedByChange.slice(0, 3);
  const topLosers = sortedByChange.slice(-3).reverse();
  const totalMarketCap = coinList.reduce((acc: number, c: any) => acc + (c.market_cap || 0), 0);
  const totalVolume = coinList.reduce((acc: number, c: any) => acc + (c.total_volume || 0), 0);
  const avgChange =
    coinList.reduce((acc: number, c: any) => acc + (c.price_change_percentage_24h || 0), 0) /
    (coinList.length || 1);

  const qLower = cleanQ.toLowerCase();
  const matchedCoin = coinList.find(
    (c: any) =>
      qLower.includes(c.symbol?.toLowerCase()) ||
      qLower.includes(c.name?.toLowerCase()) ||
      qLower.includes(c.id?.toLowerCase())
  );

  const btcChange = btc?.price_change_percentage_24h ?? 0;
  const ethChange = eth?.price_change_percentage_24h ?? 0;

  const marketSummary = `
Live CoinGecko Top 100 Market Data:
- Total Market Cap: ${formatCompact(totalMarketCap)}, 24h Volume: ${formatCompact(totalVolume)}
- Top 100 Average 24h Change: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%
- Bitcoin (BTC): Price $${btc?.current_price?.toLocaleString() || 'N/A'}, 24h: ${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%, Low: $${btc?.low_24h?.toLocaleString() || 'N/A'}, High: $${btc?.high_24h?.toLocaleString() || 'N/A'}
- Ethereum (ETH): Price $${eth?.current_price?.toLocaleString() || 'N/A'}, 24h: ${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(2)}%
- Top 3 Gainers: ${topGainers.map((g: any) => `${g.name} (${g.symbol?.toUpperCase()} +${(g.price_change_percentage_24h ?? 0).toFixed(1)}%, $${g.current_price})`).join('; ')}
- Top 3 Losers: ${topLosers.map((l: any) => `${l.name} (${l.symbol?.toUpperCase()} ${(l.price_change_percentage_24h ?? 0).toFixed(1)}%, $${l.current_price})`).join('; ')}
${matchedCoin ? `- Matched Coin: ${matchedCoin.name} (${matchedCoin.symbol?.toUpperCase()}), Rank #${matchedCoin.market_cap_rank}, Price $${matchedCoin.current_price}, 24h ${matchedCoin.price_change_percentage_24h}%, 24h High $${matchedCoin.high_24h}, 24h Low $${matchedCoin.low_24h}, Cap ${formatCompact(matchedCoin.market_cap)}` : ''}
`.trim();

  return {
    coinList,
    btc,
    eth,
    topGainers,
    topLosers,
    totalMarketCap,
    totalVolume,
    avgChange,
    matchedCoin,
    marketSummary,
  };
}

// Server-side Gemini API endpoint
app.post('/api/ask-orb', async (req, res) => {
  try {
    const { question, coins } = req.body;
    const cleanQ = (question || '').trim();

    if (!cleanQ) {
      return res.json({
        text: 'Please enter a question about any cryptocurrency or market trend.\nCheck out our quick suggestions above for instant answers.\nWe track the Top 100 coins in real time.\nNot financial advice.',
      });
    }

    const ctx = buildMarketSummary(coins, cleanQ);

    // Call server-side Gemini API using gemini-3.8-flash
    const rawApiKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawApiKey && !rawApiKey.startsWith('MY_') ? rawApiKey : '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: cleanQ,
          config: {
            abortSignal: AbortSignal.timeout(9000),
            systemInstruction: `You are Ask Orb, the crypto AI assistant for Orbix Top 100 Bubble Heatmap.
Follow these rules strictly:
1. Answer the user's question in EXACTLY 3 simple, direct lines using the provided live CoinGecko market data only.
2. The 4th and final line must be EXACTLY: "Not financial advice." (on its own line).
3. Do NOT include markdown headers, bullet points, asterisks, or conversational filler. Keep it concise.

${ctx.marketSummary}`,
          },
        });

        if (response && response.text) {
          let text = response.text.trim();
          if (!text.toLowerCase().includes('not financial advice')) {
            text += '\nNot financial advice.';
          }
          return res.json({ text });
        }
      } catch (geminiError) {
        console.warn('Server Gemini API call failed, falling back to live calculation:', geminiError);
      }
    }

    // Fallback response with live market calculation
    const fallbackText = computeServerFallback(cleanQ, ctx);
    return res.json({ text: fallbackText });
  } catch (error) {
    console.error('Error in /api/ask-orb:', error);
    return res.status(500).json({
      text: 'Temporary market data lookup issue.\nPlease try your question again in a moment.\nOrbix continuously monitors Top 100 prices.\nNot financial advice.',
    });
  }
});

// Server-side Gemini Streaming endpoint
app.post('/api/ask-orb/stream', async (req, res) => {
  try {
    const { question, coins } = req.body;
    const cleanQ = (question || '').trim();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!cleanQ) {
      res.write(`data: ${JSON.stringify({ chunk: 'Please enter a question.\nNot financial advice.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const ctx = buildMarketSummary(coins, cleanQ);
    const rawApiKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawApiKey && !rawApiKey.startsWith('MY_') ? rawApiKey : '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const stream = await ai.models.generateContentStream({
          model: 'gemini-3.8-flash',
          contents: cleanQ,
          config: {
            abortSignal: AbortSignal.timeout(15000),
            systemInstruction: `You are Ask Orb, the crypto AI assistant for Orbix Top 100 Bubble Heatmap. Answer in 3 simple lines using live CoinGecko data only + 'Not financial advice.'.\n\n${ctx.marketSummary}`,
          },
        });

        for await (const chunk of stream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (streamErr) {
        console.warn('Server Gemini stream failed, falling back:', streamErr);
      }
    }

    // Fallback streaming simulation
    const fallbackText = computeServerFallback(cleanQ, ctx);
    res.write(`data: ${JSON.stringify({ chunk: fallbackText })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (error) {
    console.error('Error in /api/ask-orb/stream:', error);
    res.write(`data: ${JSON.stringify({ chunk: 'Error retrieving market response.\nNot financial advice.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Dev and Prod serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
