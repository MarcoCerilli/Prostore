import { NextResponse } from 'next/server';

// Configurazione di MOCK:
// NOTA: Queste non sono usate direttamente qui, ma lo sarebbero in un capturePayment REALISTICO.
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "sb"; 
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "YOUR_LIVE_OR_SANDBOX_SECRET"; 

// 1. Funzione per ottenere il token di accesso PayPal (MOCK)
async function generateAccessToken(): Promise<string> {
  // SIMULAZIONE DEL TOKEN:
  // In una vera implementazione, questo userebbe CLIENT_ID e SECRET
  return `MOCK-ACCESS-TOKEN-${Date.now()}`;
}

// 2. Funzione per catturare il pagamento tramite l'API PayPal (MOCK)
async function capturePayment(paypalOrderId: string): Promise<any> {
  // SIMULAZIONE DELLA CATTURA DEL PAGAMENTO:
  // In una vera implementazione, otterresti il token e faresti una chiamata POST:
  // /v2/checkout/orders/{paypalOrderId}/capture
  
  console.log(`[PayPal MOCK] Cattura pagamento simulata per OrderID PayPal: ${paypalOrderId}`);
  
  // Assumiamo che il pagamento sia sempre COMPLETED.
  return {
      id: `CAPTURE-ID-MOCK-${Date.now()}`,
      status: 'COMPLETED',
  };
}

// 3. Funzione per aggiornare lo stato dell'ordine con Prisma (ORA SIMULATA)
async function updateOrderStatus(orderId: string, captureId: string) {
    // SIMULAZIONE DELL'AGGIORNAMENTO DEL DB:
    // Qui andrebbe la logica di Prisma (es. prisma.order.update(...))
    console.log(`[DB MOCK] Aggiornamento stato ordine interno ${orderId} come pagato con Capture ID: ${captureId}`);
}

// 4. Gestore POST (l'endpoint principale per la Cattura/Finalizzazione)
export async function POST(req: Request) {
  try {
    // Ci aspettiamo l'ID dell'ordine PayPal e il nostro ID ordine interno
    const { paypalOrderId, orderId } = await req.json();

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { success: false, message: 'Dati mancanti: paypalOrderId o orderId.' },
        { status: 400 }
      );
    }
    
    // Passo A: Verifica lo stato dell'ordine nel DB (ORA SIMULATO)
    // In un'applicazione reale: await prisma.order.findUnique(...)
    const orderFound = true;
    const orderIsPaid = false; 
    
    if (!orderFound) {
        return NextResponse.json(
            { success: false, message: `Ordine con ID ${orderId} non trovato.` },
            { status: 404 }
        );
    }
    
    if (orderIsPaid) {
        return NextResponse.json(
            { success: true, message: "Ordine già pagato (MOCK)." },
            { status: 200 }
        );
    }
    
    // Passo B: Cattura il pagamento su PayPal (ORA SIMULATO)
    // NOTA: In un'implementazione reale, avremmo bisogno anche dell'accessToken qui
    const captureResult = await capturePayment(paypalOrderId);
    
    const transactionStatus = captureResult.status;

    if (transactionStatus !== 'COMPLETED') {
        console.error("Cattura PayPal non completata (MOCK):", captureResult);
        return NextResponse.json(
            { success: false, message: `Pagamento non completato. Stato: ${transactionStatus}` },
            { status: 400 }
        );
    }
    
    // Passo C: Aggiorna lo stato dell'ordine nel database (ORA SIMULATO)
    const captureId = captureResult.id; 
    await updateOrderStatus(orderId, captureId);

    // Passo D: Successo
    return NextResponse.json({ 
      success: true, 
      message: 'Pagamento PayPal catturato con successo e ordine aggiornato (MOCK).', 
      paypalCaptureId: captureId 
    }, { status: 200 });

  } catch (error) {
    console.error("Errore nel processo di cattura del pagamento:", error);
    
    const message = error instanceof Error ? error.message : 'Errore interno del server durante la cattura del pagamento.';
    
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    );
  } 
}