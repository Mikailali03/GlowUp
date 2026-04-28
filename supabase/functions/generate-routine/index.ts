import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { quizResults, userId } = await req.json() // Pass userId from frontend
    
    // 1. Setup Supabase with Service Role (to bypass RLS for background writing)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
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

    const aiRes = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    
    const aiData = await aiRes.json()
    const routine = JSON.parse(aiData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim())

    // 3. Transform AI JSON into Table Rows
    const allSteps = [
      ...routine.am_routine.map((s: any) => ({ user_id: userId, step_name: s.step, product_name: s.product, why_logic: s.why, warning_note: s.warning, time_of_day: 'AM' })),
      ...routine.pm_routine.map((s: any) => ({ user_id: userId, step_name: s.step, product_name: s.product, why_logic: s.why, warning_note: s.warning, time_of_day: 'PM' })),
      ...routine.weekly_treatments.map((s: any) => ({ user_id: userId, step_name: s.step, product_name: s.product, time_of_day: 'Weekly' }))
    ]

    // 4. Save to DB (This won't stop even if the user closes the app!)
    await supabase.from('user_routines').insert(allSteps)
    await supabase.from('profiles').update({ has_completed_quiz: true }).eq('id', userId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})