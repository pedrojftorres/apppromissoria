import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2"
import webpush from "npm:web-push"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// CONFIGURAÇÃO VAPID
webpush.setVapidDetails(
  "mailto:admin@promissoria.app",
  Deno.env.get("BCyIwUm_0tRIBDQ3pQHSTF_zKNv83U7X-yCNsK1uxQtDHyhvGBppJPpxRTT2KhJ627-L7wsp6AfOuVfY1VoPuv0")!,
  Deno.env.get("zP0_ZyYEWwl1IyGvjIuR8hXt_N8OXI2NUpqWVT2q1qI")!
)

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const body = await req.json()
    const { action, userId, title, message, type, subscriptionData } = body

    // ===============================
    // SUBSCRIBE
    // ===============================
    if (action === "subscribe") {
      const { endpoint, keys } = subscriptionData

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
          { onConflict: "user_id,endpoint" }
        )

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ===============================
    // SEND PUSH REAL (PWA BACKGROUND)
    // ===============================
    if (action === "send") {
      // salva no banco (in-app / histórico)
      await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type,
      })

      // busca subscriptions
      const { data: subs, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)

      if (error) throw error

      if (!subs || subs.length === 0) {
        return new Response(
          JSON.stringify({ success: true, info: "No subscriptions" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // envia push real
      for (const sub of subs) {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title,
            body: message,
          })
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ===============================
    // UNSUBSCRIBE
    // ===============================
    if (action === "unsubscribe") {
      const { endpoint } = subscriptionData

      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
