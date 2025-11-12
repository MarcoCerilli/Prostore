"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Interfaccia che ora si aspetta dati temporali più specifici (giorno, anche se il campo si chiama 'month')
interface SalesData {
  month: string; // Contiene la data in formato YYYY-MM-DD (o il mese abbreviato se l'API lo cambia)
  sales: number;
}

// Funzione per formattare la data per l'asse X (da YYYY-MM-DD a GG-MM)
const formatXAxis = (tickItem: string) => {
  // Se l'API restituisce un formato data completo (es. 2023-11-20), lo formattiamo.
  if (tickItem && tickItem.includes("-") && tickItem.length >= 8) {
    const parts = tickItem.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}`; // Ritorna GG-MM
    }
  }
  // Altrimenti, ritorna la stringa originale (es. "Gen", "Feb")
  return tickItem;
};

// Custom Tooltip content per seguire lo stile shadcn/ui
const CustomTooltip = ({ active, payload, label }: any) => {
  // 🛑 FIX: Se non è attivo o non c'è una label (data), esci.
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }

  const salesValue = payload[0].value;

  let labelText = `Periodo: ${label}`;

  // Se la label è una data completa, la formattiamo per il tooltip
  if (label && label.includes("-") && label.length >= 8) {
    try {
      // Tenta di creare un oggetto Date per una formattazione completa e leggibile (GG/MM/AAAA)
      // Usiamo label.replace(/-/g, '/') per correggere la compatibilità cross-browser delle date.
      const date = new Date(label.replace(/-/g, "/"));
      if (!isNaN(date.getTime())) {
        labelText = `Data: ${date.toLocaleDateString("it-IT", { year: "numeric", month: "numeric", day: "numeric" })}`;
      }
    } catch (e) {
      // Usa il formato GG-MM come fallback
      labelText = `Data: ${formatXAxis(label)}`;
    }
  }

  return (
    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md text-sm">
      <p className="font-semibold text-gray-700">{labelText}</p>
      <p className="text-blue-600 font-medium">{`Vendite: ${Number(salesValue).toFixed(2)} €`}</p>
    </div>
  );
};

function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSalesData() {
      setIsLoading(true);
      setError(null);

      try {
        // MANTENUTO: Uso l'URL originale come richiesto
        const res = await fetch("/api/admin/summary/monthly-sales", {
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("HTTP error fetching sales data, status:", res.status);
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();

        // Mappiamo i dati, assumendo che 'month' o 'day' contenga la data YYYY-MM-DD
        const mappedData: SalesData[] = result.map((item: any) => ({
          month: item.month || item.day, // Usa 'month' o 'day' a seconda di cosa ritorna l'API
          sales: item.sales || item.totalSales || 0,
        }));

        setData(mappedData.filter((item) => item.month)); // Filtra se la chiave 'month' è vuota
      } catch (err: any) {
        console.error(
          "Could not fetch sales data from /api/admin/summary/monthly-sales:",
          err
        );
        setError(
          `Errore nel caricamento dei dati: ${err.message}. Controlla il percorso API '/api/admin/summary/monthly-sales'.`
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchSalesData();
  }, []);

  if (isLoading) {
    return <div className="text-center p-8">Caricamento Grafico...</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Andamento Vendite Giornaliere</CardTitle>
        <CardDescription>
          Vendite totali per giorno (Ordini Pagati + Consegnati)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visualizzazione dell'errore */}
        {error && (
          <div className="text-center h-[350px] flex items-center justify-center text-red-600 p-4 border border-red-300 rounded-md">
            {error}
          </div>
        )}

        {/* Nessun dato */}
        {!error && data.length === 0 && (
          <div className="text-center h-[350px] flex items-center justify-center text-gray-500">
            Nessun dato di vendita disponibile.
          </div>
        )}

        {/* Grafico */}
        {!error && data.length > 0 && (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                <XAxis
                  dataKey="month"
                  stroke="#666"
                  tickFormatter={formatXAxis}
                />

                <YAxis
                  stroke="#666"
                  tickFormatter={(value) => `${value.toFixed(0)} €`}
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(217.2 91.2% 59.8%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SalesChart;
