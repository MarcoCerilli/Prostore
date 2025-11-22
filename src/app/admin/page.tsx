// 📁 src/app/admin/page.tsx

import React from 'react';

// Importazioni di componenti UI
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 

// Importazioni di componenti di Dashboard
// Questi componenti gestiscono il fetching dei dati internamente, 
// o accettano i dati come prop.
import OrderSummaryCards from '@/components/admin/OrderSummaryCards';
import SalesChart from '@/components/admin/SalesChart';

// Nota: Essendo un Server Component, l'uso di 'async' è opzionale 
// se non fai fetch diretti qui, ma è consigliato se devi passare 
// dati ai componenti figli. Lo manteniamo sincrono per semplicità 
// dato che i figli gestiscono il fetching.
export default function AdminOverviewPage() {
    
    return (
        <div className="p-6 space-y-8">
            
            {/* Titolo Principale della Dashboard */}
            <h1 className="text-3xl font-bold">Dashboard di Amministrazione</h1>

            {/* 1. SEZIONE RIEPILOGO METRICHE (Cards) */}
            {/* OrderSummaryCards gestisce il layout 3-4 colonne */}
            <section className="mt-6">
                <OrderSummaryCards />
            </section>

            {/* 2. SEZIONE GRAFICO VENDITE */}
            <section>
                <Card>
                  {/*   <CardHeader>
                      {/*   <CardTitle>Andamento Vendite</CardTitle> 
                    </CardHeader> */}
                    <CardContent>
                        {/* Il grafico occupa lo spazio principale */}
                        <SalesChart />
                    </CardContent>
                </Card>
            </section>

            {/* 3. SEZIONE TABELLA / METRICHE SECONDARIE */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 3A. Ultimi Ordini (Esempio per una tabella) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ultimi Ordini Recenti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Qui andrebbe un componente tipo <AdminLatestOrdersTable /> */}
                        <p className="text-gray-500">Carica qui una tabella con gli ultimi ordini.</p>
                    </CardContent>
                </Card>

                {/* 3B. Utenti/Inventario (Esempio per statistiche aggiuntive) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Stato Inventario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Qui andrebbe un componente <InventorySummary /> */}
                        <p className="text-gray-500">Metriche su prodotti esauriti o a bassa giacenza.</p>
                    </CardContent>
                </Card>
                
            </section>
        </div>
    );
}