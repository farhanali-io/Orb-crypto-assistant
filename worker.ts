export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({ status: "Worker alive!", hasAI: !!env.AI }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/api/ask-orb' && request.method === 'POST') {
      try {
        const { question, coins } = await request.json() as any;
        const q = (question || '').toLowerCase();

        if (/(will.*pump|will.*go high in next|should i buy|do i buy|buy them|which coin.*will.*pump|which coin.*will go)/i.test(q)) {
          return new Response(JSON.stringify({ text: "I cannot predict future prices or advise on buying. I only share current live data: price, 24h/7d/30d/1y changes, market cap and volume.\nTell me which coin you want data for.\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });
        }

        // If user asks hamster, coins[0] will be undefined - handle it
        if (q.includes('hamster')) {
          return new Response(JSON.stringify({ text: "Hamster Kombat (HMSTR) is not in Top 100 right now, so I don't have live price. I track Top 100 only. Ask me about BTC, TRX, ETH, etc.\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });
        }

        const target = coins?.[0];
        const contextList = (coins || []).slice(0,3).map((c:any)=>({
          name: c.name, symbol: c.symbol, price: c.current_price,
          change24h: c.price_change_percentage_24h,
          change7d: (c as any).price_change_percentage_7d_in_currency,
          change30d: (c as any).price_change_percentage_30d_in_currency,
          change1y: (c as any).price_change_percentage_1y_in_currency,
          rank: c.market_cap_rank
        }));

        const prompt = `You are Orb crypto assistant. Data: ${JSON.stringify(contextList)}. User asks: "${question}". RULES: Use data, never output JSON array, never predict future. 1-2 sentences. End with: Not financial advice.`;

        let textResponse: string | null = null;
        if (env.AI) {
          try {
            const r: any = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
              messages: [
                { role: 'system', content: 'You are helpful crypto assistant. Never show JSON, never predict.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 300
            });
            textResponse = r.response || r.text || null;
          } catch {}
        }

        if (textResponse) {
          textResponse = textResponse.replace(/\[.*\{.*\}.*\]/g, '').replace(/\{.*\}/g, '').trim();
          textResponse = textResponse.replace(/I removed.*|I added.*|# I.*/gi, '').trim();
          textResponse = textResponse.replace(/Not financial advice\.?/gi, '').trim();
          const parts = textResponse.split('. ').filter((s:string)=>s.trim().length>5 && !s.includes('price_change') && !s.includes('symbol')).slice(0,3);
          let clean = parts.join('. ');
          if(clean && !clean.endsWith('.')) clean += '.';
          if(!clean && target) clean = `${target.name} is $${target.current_price?.toLocaleString()} with 24h ${target.price_change_percentage_24h?.toFixed(2)}%.`;
          if(!clean) clean = `BTC is trading now.`;
          textResponse = clean + "\nNot financial advice.";
          return new Response(JSON.stringify({ text: textResponse }), { headers: {'Content-Type': 'application/json'} });
        }

        return new Response(JSON.stringify({ text: `${target?.name || 'BTC'} is $${target?.current_price?.toLocaleString()}.\nNot financial advice.` }), { headers: {'Content-Type': 'application/json'} });

      } catch (err: any) {
        return new Response(JSON.stringify({ text: "Server error: " + err.message + "\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });
      }
    }
    return env.ASSETS.fetch(request);
  }
}
