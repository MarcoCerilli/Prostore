
"use client";


import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import Menu from "./menu";
import CategoryDrawer from "./category-drawer";
import Search from "./search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Header = ({ categories }: { categories: any[] }) => {
    return <header className="w-full border-b">
        <div className="wrapper flex-between">
            <div className="flex-start gap-4">
                <CategoryDrawer categories={categories}/>
                <Link href="/" className="flex-start ml-4">
                    <Image src="/images/logo.svg" alt={`${APP_NAME} logo`} height={48} width={48} priority={true}
                    />
                    <span className="hidden lg:block font-bold text-2xl ml-3">
                        {APP_NAME}
                    </span>
                </Link>
            </div>
           <div className="hidden md:flex items-center gap-4">
                <div className="w-48"> 
                    <Select onValueChange={(value) => console.log(value)}> 
                    </Select>
                </div>
                <Search categories={categories} />
            </div> 
          <Menu/>
        </div>
    </header>;
}

export default Header;