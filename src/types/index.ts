import z from "zod";
import { insertProductschema } from "@/lib/validators";

export type Product = z.infer<typeof insertProductschema> & {
  id: string; // manteniamo l Id perche nn è presente nello schema
  rating: string;
  createdAt: Date










};
