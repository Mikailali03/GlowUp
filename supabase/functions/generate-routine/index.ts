// 1. Modern Deno imports
import { serve } from "std/http/server.ts"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { quizResults, userId } = await req.json()
    
    // Using explicit casting for Deno globals to satisfy TS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`

    const prompt = `
      Act as a professional aesthetician. Create a high-end skincare routine for: ${JSON.stringify(quizResults)}.
      Return ONLY a JSON object with: am_routine, pm_routine, weekly_treatments.
      Each item MUST have: step, product, why, warning.
    `

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    })
    
    const aiData = await aiRes.json()

    // 2. Defensive check for Gemini Response
    if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("GOOGLE API ERROR RAW:", JSON.stringify(aiData))
      throw new Error("AI failed to provide a valid routine candidate.")
    }

    const routine = JSON.parse(aiData.candidates[0].content.parts[0].text)

    const allSteps = [
      ...routine.am_routine.map((s: any) => ({ 
        user_id: userId, step_name: s.step, product_name: s.product, 
        why_logic: s.why, warning_note: s.warning, time_of_day: 'AM' 
      })),
      ...routine.pm_routine.map((s: any) => ({ 
        user_id: userId, step_name: s.step, product_name: s.product, 
        why_logic: s.why, warning_note: s.warning, time_of_day: 'PM' 
      })),
      ...(routine.weekly_treatments || []).map((s: any) => ({ 
        user_id: userId, step_name: s.step, product_name: s.product, 
        why_logic: s.why, time_of_day: 'Weekly' 
      }))
    ]

    const { error: insertError } = await supabase.from('user_routines').insert(allSteps)
    if (insertError) throw insertError

    await supabase.from('profiles').update({ has_completed_quiz: true }).eq('id', userId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    // 3. Fix for 'error is of type unknown'
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("CRITICAL ERROR:", errorMessage)
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})