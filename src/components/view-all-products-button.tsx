import { Button } from "./ui/button";
import Link from "next/link";

const ViewAllProductsButton = () => {
  return (
    <div className="flex justify-center mt-8">
      <Link href="/search">
        <Button
          className="bg-indigo-600 
         hover:bg-indigo-700 
         text-white 
         font-bold 
         py-2 
         px-4 
         rounded 
         transition 
         duration-150"
        >
          Vedi Tutti i Prodotti
        </Button>
      </Link>
    </div>
  );
};

export default ViewAllProductsButton;
