import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokens, title, body, data }: NotificationRequest = await req.json();
    
    console.log(`Sending notifications to ${tokens.length} devices`);
    
    // Get Firebase Server Key from environment
    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    
    if (!firebaseServerKey) {
      throw new Error('Firebase Server Key not configured');
    }

    // Send notifications to all tokens
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${firebaseServerKey}`,
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title,
              body,
              sound: 'default',
            },
            data: data || {},
            priority: 'high',
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to send notification: ${error}`);
          throw new Error(error);
        }

        return await response.json();
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        failed: failed 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
