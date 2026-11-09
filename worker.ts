export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Test Route
    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({ 
        status: "Worker is alive!", 
        hasKey: !!env.GEMINI_API_KEY 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Chatbot Route
    if (url.pathname === '/api/ask-orb' && request.method === 'POST') {
      try {
        const { question, coins } = await request.json() as any;
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ text: "Error: GEMINI_API_KEY is missing." }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        // Only send essential data to avoid token limits
        const essentialCoins = coins.slice(0, 20).map((c: any) => ({
          symbol: c.symbol.toUpperCase(),
          price: c.current_price,
          change24h: c.price_change_percentage_24h
        }));

        // Using the latest stable model name
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: `You are Ask Orb, a helpful crypto AI assistant. Answer the user's question in exactly 3 short sentences using this live market data: ${JSON.stringify(essentialCoins)}. The 4th line must be exactly "Not financial advice." Question: ${question}` 
              }] 
            }],
            // Turn off safety filters for financial data
            safetySettings: [
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
            ]
          }),
          // 👇 FIX: Stop waiting after 15 seconds to prevent 524 error 👇
          signal: AbortSignal.timeout(15000)
        });

        const data = await geminiRes.json() as any;
        
        // Check for API errors
        if (data.error) {
          return new Response(JSON.stringify({ text: "Gemini API Error: " + data.error.message }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        // Check if response is empty or blocked
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
           return new Response(JSON.stringify({ text: "Gemini blocked the response or returned empty. Reason: " + (data.promptFeedback?.blockReason || "Unknown") }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        const text = data.candidates[0].content.parts[0].text;
        return new Response(JSON.stringify({ text: text + "\nNot financial advice." }), { headers: {'Content-Type': 'application/json'} });

      } catch (err: any) {
        // 👇 FIX: Catch the timeout error and return a friendly message 👇
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          return new Response(JSON.stringify({ text: "The AI is taking too long to respond. Please try a shorter question.\nNot financial advice." }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }
        
        return new Response(JSON.stringify({ text: "Server error: " + err.message }), { status: 200, headers: {'Content-Type': 'application/json'} });
      }
    }

    // 3. Serve Frontend
    return env.ASSETS.fetch(request);
  }
}
