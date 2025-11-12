// components/admin/OrderSummaryCards.js

"use client"


import React, { useState, useEffect } from 'react';
import { AdminSummaryData } from '@/types/admin';

function OrderSummaryCards() {
  const [summary, setSummary] = useState<AdminSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/admin/summary/global');
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Could not fetch summary:", err);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (isLoading) {
    return <div>Caricamento Riepilogo...</div>;
  }

  if (!summary) {
    return <div>Errore nel caricamento dei dati di riepilogo.</div>;
  }

  const cardsData = [
    { title: "Totale Vendite", value: `${(summary.totalSales ?? 0).toFixed(2)} €`, color: "bg-green-100" },
    { title: "Ordini Totali", value: summary.totalOrders ?? 0, color: "bg-blue-100" },
    { title: "In Attesa di Pag.", value: summary.pendingOrders ?? 0, color: "bg-yellow-100" },
    { title: "Ordini Spediti", value: summary.shippedOrders ?? 0, color: "bg-purple-100" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cardsData.map((card, index) => (
        <div key={index} className={`${card.color} p-5 rounded-lg shadow-md`}>
          <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
          <p className="mt-1 text-3xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default OrderSummaryCards;