export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({ status: "Worker is alive!", hasKey: !!env.GEMINI_API_KEY }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/ask-orb' && request.method === 'POST') {
      try {
        const { question, coins } = await request.json() as any;
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ text: "Error: GEMINI_API_KEY is missing." }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        // Smart Filtering (only send relevant coins)
        const q = question.toLowerCase();
        const mentionedCoins = coins.filter((c: any) => 
          q.includes(c.symbol.toLowerCase()) || q.includes(c.name.toLowerCase())
        );

        const contextData = (mentionedCoins.length > 0 ? mentionedCoins.slice(0, 3) : coins.slice(0, 5)).map((c: any) => ({
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: c.current_price,
          change24h: c.price_change_percentage_24h
        }));

        // 👇 CHANGED: Using the fastest, most stable model 👇
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                // 👇 CHANGED: Explicitly forbid predictions to speed up response 👇
                text: `You are Ask Orb, a crypto AI assistant. Answer in exactly 3 short sentences using this live market data: ${JSON.stringify(contextData)}. Never predict the future or say if a coin will pump/dump. Only state current facts. The 4th line must be exactly "Not financial advice." Question: ${question}` 
              }] 
            }],
            safetySettings: [
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
            ]
          }),
          // 👇 CHANGED: Timeout reduced to 6 seconds. If Google is slow, fail fast. 👇
          signal: AbortSignal.timeout(6000)
        });

        const data = await geminiRes.json() as any;
        
        if (data.error) {
          return new Response(JSON.stringify({ text: "Gemini API Error: " + data.error.message }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
           return new Response(JSON.stringify({ text: "Gemini blocked the response." }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        const text = data.candidates[0].content.parts[0].text;
        return new Response(JSON.stringify({ text: text + "\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });

      } catch (err: any) {
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          return new Response(JSON.stringify({ text: "I cannot predict the future. However, Bitcoin's current price and 24h change are in the chart above.\nNot financial advice." }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }
        return new Response(JSON.stringify({ text: "Server error: " + err.message }), { status: 200, headers: {'Content-Type': 'application/json'} });
      }
    }

    return env.ASSETS.fetch(request);
  }
}
