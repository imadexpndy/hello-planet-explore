import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId, amount, paymentMethod } = await req.json();

    // CMI Payment Gateway Stub
    let paymentResult;
    if (paymentMethod === 'cmi_card') {
      // Simulate CMI payment processing
      paymentResult = {
        success: Math.random() > 0.1, // 90% success rate for testing
        transactionId: `CMI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: Math.random() > 0.1 ? 'confirmed' : 'failed'
      };
    } else {
      // For bank_transfer or check, status remains pending
      paymentResult = {
        success: true,
        transactionId: `${paymentMethod.toUpperCase()}_${Date.now()}`,
        status: 'pending'
      };
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: amount,
        payment_method: paymentMethod,
        payment_status: paymentResult.status,
        transaction_id: paymentResult.transactionId,
        payment_data: { 
          gateway: paymentMethod === 'cmi_card' ? 'cmi' : 'manual',
          processed_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update booking status based on payment result
    let bookingStatus = 'pending';
    if (paymentResult.status === 'confirmed') {
      bookingStatus = 'confirmed';
    } else if (paymentResult.status === 'failed') {
      bookingStatus = 'cancelled';
    }

    await supabaseClient
      .from('bookings')
      .update({ status: bookingStatus })
      .eq('id', bookingId);

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'payment_processed',
        entity_type: 'payment',
        entity_id: payment.id,
        details: {
          booking_id: bookingId,
          amount: amount,
          payment_method: paymentMethod,
          status: paymentResult.status,
          transaction_id: paymentResult.transactionId
        }
      });

    return new Response(
      JSON.stringify({
        success: paymentResult.success,
        paymentId: payment.id,
        status: paymentResult.status,
        transactionId: paymentResult.transactionId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});