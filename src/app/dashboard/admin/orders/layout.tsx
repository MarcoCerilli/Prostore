// 📁 src/app/admin/orders/layout.tsx

import React from 'react';

// Se devi aggiungere elementi UNICI solo per la pagina ordini, falli qui.
// Altrimenti, questo file può essere molto semplice:

export default function AdminOrdersLayout({ 
  children,
}: Readonly<{ 
  children: React.ReactNode; 
}>) {
  return (
    // Puoi aggiungere un div per styling specifico della pagina ordini,
    // oppure semplicemente restituire children se non serve wrapping aggiuntivo.
    <div className="orders-page-wrapper">
      {children}
    </div>
  );
}