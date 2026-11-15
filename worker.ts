export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({ 
        status: "Worker alive!", 
        hasGemini: !!env.GEMINI_API_KEY,
        hasGroq: !!env.GROQ_API_KEY,
        hasOpenRouter: !!env.OPENROUTER_API_KEY,
        hasAI: !!env.AI
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/ask-orb' && request.method === 'POST') {
      try {
        const { question, coins, lastCoin } = await request.json() as any;
        const q = question.toLowerCase();

        // 1. Find mentioned coins - also check lastCoin for "its" questions
        let mentionedCoins = coins.filter((c: any) => 
          q.includes(c.symbol.toLowerCase()) || q.includes(c.name.toLowerCase())
        );
        // If "its" and nothing found, use lastCoin context
        if (mentionedCoins.length === 0 && lastCoin) {
          const lc = coins.find((c:any) => c.symbol.toLowerCase() === lastCoin.toLowerCase() || c.id === lastCoin);
          if (lc) mentionedCoins = [lc];
        }

        const contextCoins = (mentionedCoins.length > 0 ? mentionedCoins.slice(0, 3) : coins.slice(0, 5)).map((c: any) => ({
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: c.current_price,
          change24h: c.price_change_percentage_24h,
          change7d: c.price_change_percentage_7d_in_currency,
          change30d: c.price_change_percentage_30d_in_currency,
          market_cap: c.market_cap,
          volume: c.total_volume
        }));

        const systemPrompt = `You are Orb, live crypto assistant. Use ONLY this live market data: ${JSON.stringify(contextCoins)}. If question says "its weekly/monthly change", use change7d / change30d from data. Answer in 3 short sentences max. 4th line exactly "Not financial advice." Never invent prices. Question: ${question}`;

        async function tryCloudflareAI(): Promise<string | null> {
          if (!env.AI) return null;
          try {
            const res: any = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
              prompt: systemPrompt,
              max_tokens: 200
            });
            return res.response || res.text || null;
          } catch (e) { return null; }
        }

        async function tryGroq(): Promise<string | null> {
          if (!env.GROQ_API_KEY) return null;
          try {
            const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: systemPrompt }],
                max_tokens: 200
              })
            });
            const d: any = await r.json();
            return d.choices?.[0]?.message?.content || null;
          } catch (e) { return null; }
        }

        async function tryOpenRouter(): Promise<string | null> {
          if (!env.OPENROUTER_API_KEY) return null;
          try {
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`, 'HTTP-Referer': 'https://orb-crypto-assistant.workers.dev' },
              body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                messages: [{ role: 'user', content: systemPrompt }],
                max_tokens: 200
              })
            });
            const d: any = await r.json();
            return d.choices?.[0]?.message?.content || null;
          } catch (e) { return null; }
        }

        async function tryGemini(model: string): Promise<string | null> {
          if (!env.GEMINI_API_KEY) return null;
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
            const r = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
              signal: AbortSignal.timeout(7000)
            });
            const d: any = await r.json();
            if (d.error) return null;
            return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
          } catch (e) { return null; }
        }

        // Try in order: Cloudflare AI (FREE) -> Groq -> OpenRouter -> Gemini
        let textResponse = await tryCloudflareAI()
          || await tryGroq()
          || await tryOpenRouter()
          || await tryGemini("gemini-2.0-flash")
          || await tryGemini("gemini-2.0-flash-lite")
          || await tryGemini("gemini-1.5-flash");

        if (textResponse) {
          if (!textResponse.includes("Not financial advice")) textResponse += "\nNot financial advice.";
          return new Response(JSON.stringify({ text: textResponse }), { headers: {'Content-Type': 'application/json'} });
        } else {
          return new Response(JSON.stringify({ text: "Orb is busy - all AI quotas hit. Try again in 30 sec.\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });
        }

      } catch (err: any) {
        return new Response(JSON.stringify({ text: "Server error: " + err.message }), { headers: {'Content-Type': 'application/json'} });
      }
    }
    return env.ASSETS.fetch(request);
  }
}
