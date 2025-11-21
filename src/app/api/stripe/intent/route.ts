import { createStripePaymentIntentAction } from "@/lib/actions/stripe.actions";
import { NextResponse, NextRequest } from "next/server"; // ✅ Importa NextRequest

export async function POST(request: NextRequest) {
    const payload = await request.json();

    // 🔑 NUOVO: Logica per determinare l'URL di base dinamico (Locale o Vercel/Produzione)
    let baseUrl = "";
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        // Vercel (Production/Staging): usa l'URL fornito da Vercel
        baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    } else {
        // Locale (Development): usa le intestazioni HTTP
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
        const protocol = request.headers.get("x-forwarded-proto") || 'http';
        
        if (host) {
            baseUrl = `${protocol}://${host}`;
        } else {
             console.error("API ROUTE ERROR: Impossibile determinare l'URL host.");
             return NextResponse.json({ error: "Configuration Error: Base URL not found." }, { status: 500 });
        }
    }

    // 🔑 Modificato: Chiama la Server Action PASSANDO l'URL base
    const result = await createStripePaymentIntentAction({
        ...payload,
        baseUrl: baseUrl, // Passa il valore dinamico
    }); 

    if (result.success) {
        return NextResponse.json({ clientSecret: result.clientSecret });
    } else {
        return NextResponse.json({ error: result.message }, { status: 500 });
    }
}