import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { quizResults } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    // FIX 1: Use the current stable production model ID
    // Even in 2026, "gemini-1.5-flash" remains the standard production alias 
    // unless you have been whitelisted for a specific 3.1 preview.
    const model = "gemini-flash-latest"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    const prompt = `
      Act as a professional dermatologist. 
      Create a skin care routine for: 
      Age: ${quizResults.age}, Sex: ${quizResults.sex}, Skin: ${quizResults.skin_type}, 
      Concerns: ${quizResults.concerns?.join(', ')}, Facial Hair: ${quizResults.facial_hair}.

      Structure your response exactly like this:
      {
        "am_routine": [{"step": "string", "product": "string", "why": "string", "warning": "Collapsed note or null"}],
        "pm_routine": [{"step": "string", "product": "string", "why": "string", "warning": "Avoid using with Vitamin C or Retinol or null"}],
        "weekly_treatments": [{"step": "string", "product": "string", "frequency": "string"}],
        "safety_warnings": ["string"]
      }
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // FIX 2: Use generationConfig to FORCE JSON output. 
        // This stops the AI from adding "Here is your routine:" text.
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    })

    const data = await response.json()
    
    // FIX 3: Better error reporting
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      throw new Error(data.error.message);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from AI.");
    }

    // Extract text
    const text = data.candidates[0].content.parts[0].text;

    // FIX 4: No more substring hacking needed if response_mime_type is used, 
    // but we keep a simple parse check just in case.
    const routineData = JSON.parse(text);

    return new Response(JSON.stringify(routineData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})