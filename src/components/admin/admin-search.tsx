"use client";

import { usePathname, useSearchParams } from "next/navigation";

const AdminSearch = () => {
  const pathname = usePathname();
  let formActionUrl = "/dashboard/admin/products";

  if (pathname.includes("/dashboard/admin/products")) {
    formActionUrl = "/dashboard/admin/products";
  } else if (pathname.includes("/dashboard/admin/users")) {
    formActionUrl = "/dashboard/admin/users";
  } else if (pathname.includes("/dashboard/admin/orders")) {
    formActionUrl = "/dashboard/admin/orders";
  }

  const searchParams = useSearchParams();
  const queryValue = searchParams.get("query") || "";

  return (
    <form action={formActionUrl} method="GET" className="flex items-center space-x-2">
      <input
        key={queryValue}
        type="search"
        name="query"
        defaultValue={queryValue}
        placeholder="Cerca ID, nome..."
        className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-1.5 text-sm w-44 sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition duration-150 font-medium"
      >
        Cerca
      </button>
    </form>
  );
};

export default AdminSearch;