
"use client"

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const AdminSearch = () => {
    const pathname = usePathname();
    let formActionUrl = "/admin/products"; // Default action URL

    if (pathname.includes("/admin/products")){
        formActionUrl = "/admin/products";
    }else if (pathname.includes("/admin/users")){
        formActionUrl = "/admin/users";
    }else if (pathname.includes("/admin/orders")){
        formActionUrl = "/admin/orders";
    }

            const searchParams = useSearchParams()
 const [queryValue, setQueryValue] = useState(searchParams.get("query") || "");
     
 useEffect(() => {
    setQueryValue(searchParams.get("query") || "");
 }, [searchParams]);


    return <form action={formActionUrl} method="GET" className="flex items-center justify-end space-x-2 mr-10"> {/* ✅ Aggiunto flex layout */}
            <input
                type="search"
                name="query"
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                placeholder="Cerca per ID, nome cliente..." // Testo più specifico
                className="border border-gray-300 rounded px-4 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-150">
                Cerca
            </button>
        </form>
}
 
export default AdminSearch;