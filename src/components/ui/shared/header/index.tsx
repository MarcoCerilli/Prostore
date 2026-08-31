"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import Menu from "./menu";
import CategoryDrawer from "./category-drawer";
import Search from "./search";

interface CategoryItem {
  name: string;
  slug: string;
  _count?: number;
}

const Header = ({
  categories,
  cartCount = 0,
}: {
  categories: CategoryItem[];
  cartCount?: number;
}) => {
  return (
    <header className="w-full border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="wrapper flex-between py-2.5">
        <div className="flex-start gap-3 sm:gap-4">
          <CategoryDrawer categories={categories} />
          <Link href="/" className="flex-start ml-1 sm:ml-2 group">
            <Image
              src="/images/logo.svg"
              alt={`${APP_NAME} logo`}
              height={38}
              width={38}
              priority={true}
              className="transition-transform group-hover:scale-105"
            />
            <span className="hidden sm:block font-bold text-xl sm:text-2xl ml-2.5 tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-lg mx-6">
          <Search categories={categories} />
        </div>

        <Menu cartCount={cartCount} />
      </div>
    </header>
  );
};

export default Header;