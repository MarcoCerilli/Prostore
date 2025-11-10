// File: pages/api/payments/paypal/create-order.ts

import { NextResponse } from 'next/server';

/**
 * Route API per CREARE un ordine sui server PayPal (MOCK).
 * L'obiettivo è restituire l'ID dell'ordine GENERATO da PayPal.
 * I pulsanti PayPal nel frontend devono ricevere questa risposta.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalAmount } = body; 

    // 🛑 DEBUG API: Controlla la struttura esatta del corpo della richiesta
    console.log("DEBUG API - Payload di PayPal Create-Order ricevuto:", body);

    if (!totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Total amount mancante.' },
        { status: 400 }
      );
    }
    
    // PASSO DI MOCKING PER PAYPAL:
    
    // In un'applicazione REALE, qui useresti le credenziali di PayPal 
    // per creare l'ordine e ricevere il VERO ID di PayPal.
    // Esempio: const paypalOrder = await paypalClient.createOrder(totalAmount);
    
    // ✅ CORREZIONE: Generiamo un ID fittizio che SIMULA l'ID di PayPal.
    // L'ID di PayPal è cruciale per la transazione.
    const mockPayPalOrderId = `ORDER-${crypto.randomUUID()}`; 
    
    // Passo 2: Restituisce l'ID di PayPal
    // L'SDK di PayPal si aspetta che la risposta contenga una chiave 'id' o 'orderID'.
    // Usiamo 'id' come è comune nello standard.
    return NextResponse.json(
      { 
        id: mockPayPalOrderId, // <--- ID FITTIZIO DI PAYPAL RESTITUITO
        status: 'CREATED',
        message: 'Ordine creato con successo su PayPal (MOCK).',
        success:true,
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Errore durante la creazione dell'ordine PayPal:", error);
    
    return NextResponse.json(
      { success: false, message: 'Errore interno del server durante la creazione dell\'ordine PayPal.' },
      { status: 500 }
    );
  } 
}