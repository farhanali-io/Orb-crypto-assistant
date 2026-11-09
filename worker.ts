export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle the Chatbot API Route
    if (url.pathname === '/api/ask-orb' && request.method === 'POST') {
      try {
        const { question, coins } = await request.json() as any;
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ text: "Error: GEMINI_API_KEY is missing in Cloudflare." }), { status: 500 });
        }

        // Call Gemini API directly using fetch
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are Ask Orb, a crypto assistant. Answer in exactly 3 lines using this live data: ${JSON.stringify(coins)}. Question: ${question}` }] }]
          })
        });

        const data = await geminiRes.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        return new Response(JSON.stringify({ text: text + "\nNot financial advice." }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ text: "Server error calling Gemini." }), { status: 500 });
      }
    }

    // 2. Serve Static Assets (Fallback for everything else)
    // Cloudflare handles this automatically if configured in wrangler.toml
    return new Response("Not Found", { status: 404 });
  }
}
