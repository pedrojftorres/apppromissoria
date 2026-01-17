import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const body = await req.json()
    const { action, userId, title, message, type, subscriptionData } = body
    
    console.log(`Action: ${action}, UserId: ${userId}`)
    
    // Save subscription
    if (action === 'subscribe') {
      const { endpoint, keys } = subscriptionData
      
      console.log('Saving subscription for user:', userId)
      console.log('Endpoint:', endpoint?.substring(0, 60) + '...')
      
      // Upsert subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth
        }, { onConflict: 'user_id,endpoint' })
      
      if (error) {
        console.error('Error saving subscription:', error)
        throw error
      }
      
      console.log('Subscription saved successfully')
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Send notification
    if (action === 'send') {
      // Save to notifications table for in-app notifications
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type
      })
      
      if (notifError) {
        console.error('Error saving notification:', notifError)
      } else {
        console.log('Notification saved to database for realtime delivery')
      }
      
      // Get subscription count for logging
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
      
      if (subError) {
        console.error('Error fetching subscriptions:', subError)
      }
      
      const count = subscriptions?.length || 0
      console.log(`User ${userId} has ${count} push subscriptions registered`)
      
      // Note: Full Web Push Protocol with VAPID and encryption requires 
      // complex crypto operations. The notification is saved to DB and 
      // delivered via Supabase Realtime which works when app is open.
      // For true background push, users should use the PWA with service worker.
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification saved and will be delivered via realtime',
          subscriptionCount: count
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Unsubscribe
    if (action === 'unsubscribe') {
      const { endpoint } = subscriptionData
      
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
      
      if (error) {
        console.error('Error removing subscription:', error)
        throw error
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})