// app/api/stripe/intent/route.ts
import { createStripePaymentIntentAction } from "@/lib/actions/stripe.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const payload = await request.json();

    // Chiama la tua logica esistente!
    const result = await createStripePaymentIntentAction(payload); 

    if (result.success) {
        return NextResponse.json({ clientSecret: result.clientSecret });
    } else {
        return NextResponse.json({ error: result.message }, { status: 500 });
    }
}