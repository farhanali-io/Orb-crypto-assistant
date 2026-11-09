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

        // 👇 AUTO-FALLBACK LOGIC 👇
        // We try gemini-2.0-flash first, and if it fails, we fall back to gemini-1.5-flash-latest
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash-latest"];
        let textResponse = "";
        let lastError = "";

        for (const model of modelsToTry) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          try {
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ 
                  parts: [{ 
                    text: `You are Ask Orb, a crypto AI assistant. Answer in exactly 3 short sentences using this live market data: ${JSON.stringify(contextData)}. Never predict the future. The 4th line must be exactly "Not financial advice." Question: ${question}` 
                  }] 
                }],
                safetySettings: [
                  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
              }),
              signal: AbortSignal.timeout(8000) // 8 second timeout
            });

            const data = await geminiRes.json() as any;
            
            if (data.error) {
              lastError = data.error.message;
              continue; // Try the next model in the list
            }

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
              textResponse = data.candidates[0].content.parts[0].text;
              break; // Success! Exit the loop.
            }
          } catch (err: any) {
            lastError = err.message;
            // If it's a timeout, don't try the next model, just fail fast
            if (err.name === 'AbortError' || err.name === 'TimeoutError') {
                break; 
            }
          }
        }

        if (textResponse) {
          return new Response(JSON.stringify({ text: textResponse + "\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });
        } else {
          // If both models fail, return the error
          return new Response(JSON.stringify({ text: "AI Error: " + lastError }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

      } catch (err: any) {
        return new Response(JSON.stringify({ text: "Server error: " + err.message }), { status: 200, headers: {'Content-Type': 'application/json'} });
      }
    }

    return env.ASSETS.fetch(request);
  }
}
