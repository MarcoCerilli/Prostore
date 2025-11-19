// 📁 src/app/admin/layout.tsx

import React from 'react';

// Importa la tua Navbar specifica per l'area Admin
import AdminNavbar from '@/components/admin/AdminNavbar'; 
// Se devi importare anche la sidebar o altri elementi specifici dell'Admin, fallo qui.

export default function AdminLayout({ 
  children,
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 🛑 Aggiunge la Navbar GLOBALE Admin in cima */}
      <AdminNavbar /> 

      {/* Il resto del contenuto (le pagine admin/orders, admin/users, ecc.) */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children} 
        </div>
      </main>
    </div>
  );
}