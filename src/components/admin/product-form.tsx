// Componente: ProductForm.tsx

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { productDefaultValues } from "@/lib/constants";
// Importazioni corrette (assumo che CombinedProductFormSchema, insertProductschema, updateProductSchema siano definiti)
import { CombinedProductFormSchema, insertProductschema, updateProductSchema } from "@/lib/validators"; 
import { Product } from "@/types";
import { useRouter } from "next/navigation";
import {
  Resolver,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import * as z from "zod"; 
import {
  Form,
  FormLabel,
  FormMessage,
  FormField,
  FormDescription,
  FormControl,
  FormItem,
} from "../ui/form";
import slugify from "slugify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { UploadButton } from "@/lib/uploadthing";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";

// ⭐️ FIX: Tipi derivati dagli schemi Zod per un uso pulito nelle action e nel form
type FormSchemaType = z.infer<typeof CombinedProductFormSchema>;
type InsertSchemaType = z.infer<typeof insertProductschema>;
type UpdateSchemaType = z.infer<typeof updateProductSchema>;


const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: "Create" | "Update";
  product?: Product;
  productId?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  // 1. SCELTA DELLO SCHEMA
  // Il tipo dello schema non è strettamente necessario qui, ma è utile per il resolver
  const schema = type === "Update" ? updateProductSchema : insertProductschema;
  
  // 2. LOGICA DEI DEFAULT VALUES
  // 💡 FIX: La logica qui deve produrre un FormSchemaType in entrambi i rami
  const defaultValues: FormSchemaType =
    product && type === "Update"
      ? {
          // Aggiornamento: usa i dati esistenti, assicurando che id, images, isFeatured e banner siano presenti
          ...product,
          // L'ID viene garantito qui dall'esterno, se non c'è, verrà gestito da zod
          id: productId, 
          images: product.images || [],
          isFeatured: product.isFeatured ?? false,
          banner: product.banner || "",
        }
      : {
          // Creazione: usa i default values, assicurando che id sia undefined
          ...productDefaultValues,
          id: undefined, // Importante che sia undefined per lo schema di creazione
          images: [],
          isFeatured: false,
          banner: "",
          // FIX: Coercizione a numero/valore predefinito corretto per evitare problemi di tipizzazione iniziale
          price: productDefaultValues.price || 0, 
          stock: productDefaultValues.stock || 0,
        };

  // 3. useForm \con il tipo unico e resolver specifico
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(schema) as Resolver<FormSchemaType>, 
    defaultValues: defaultValues,
  });

  // Estrazione di watch per immagini e isFeatured
  const images = form.watch("images");
  const isFeatured = form.watch("isFeatured");

  // Funzione per generare lo slug
  const handleGenerateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      const slug = slugify(name, {
        lower: true,
        strict: true,
      });
      form.setValue("slug", slug, { 
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const onSubmit: SubmitHandler<FormSchemaType> = async (values) => {
    let res;
    
    if (type === "Create") {
      const createValues = { ...values };
      delete createValues.id;
      res = await createProduct(createValues as InsertSchemaType); 
    } else {
      // Per l'aggiornamento, l'ID è richiesto e garantito dal `defaultValues` (almeno nella logica)
      // Castiamo solo al tipo necessario per l'Action
      res = await updateProduct(values as UpdateSchemaType);
    }

    if (!res.success) {
      toast({ variant: "destructive", description: res.message });
    } else {
      toast({ description: res.message });
      router.push("/dashboard/admin/products");
    }
  };

  // Funzione helper per la rimozione dell'immagine (logica OK)
  const handleRemoveImage = (urlToRemove: string) => {
    const newImages = images.filter((img: string) => img !== urlToRemove);
    form.setValue("images", newImages, { 
      shouldValidate: true,
      shouldDirty: true,
    });
    toast({ description: "Immagine rimossa." });
  };
  
  // Funzione helper per la rimozione del banner (logica OK)
  const handleRemoveBanner = () => {
    // Assegnamo la stringa vuota, che il preprocess di Zod trasformerà in null/undefined
    form.setValue("banner", "", { 
        shouldValidate: true,
        shouldDirty: true,
    });
    toast({ description: "Banner rimosso." });
  };


  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* <Form {...form}> è corretto perché `form` è un UseFormReturn */}
      <Form {...form}>
        <form
          method="POST"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
        >
          {/* --- Sezione Dati Base --- */}
          
          {/* ROW 1: Nome & Slug (50/50) */}
          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="name" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nome Prodotto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Esempio: T-shirt Oversize 'Girasole'"
                      {...field}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="slug" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Slug (URL Amichevole)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="t-shirt-oversize-girasole"
                      {...field}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      aria-label="Genera Slug Automatico"
                    >
                      Genera Slug Automatico
                    </Button>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* ROW 2: Category & Brand (50/50) */}
          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="category" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Esempio: Abbigliamento, Elettronica"
                      {...field}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="brand" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Marchio (Brand)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Esempio: Nike, Apple, Il tuo Brand"
                      {...field}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ROW 3: Price & Stock (50/50) */}
          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="price" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Prezzo (€)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="99.99"
                      {...field}
                      type="number"
                      className="h-10"
                      // FIX: Gestione della conversione del valore per input numerico (valore a 0 se campo vuoto)
                      onChange={(e) => {
                        const value = e.target.value;
                        // Usiamo parse float se i prezzi possono avere decimali
                        field.onChange(value === "" ? 0 : parseFloat(value)); 
                      }}
                      // FIX: Se il valore è null/undefined, mostriamo una stringa vuota
                      value={field.value ?? ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-1">
            <FormField
              control={form.control}
              name="stock" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Giacenza (Quantità Disponibile)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Inserisci la disponibilità in magazzino"
                      {...field}
                      type="number"
                      className="h-10"
                      // FIX: Gestione della conversione del valore per input numerico (valore a 0 se campo vuoto)
                      onChange={(e) => {
                        const value = e.target.value;
                        // Usiamo parseInt perché stock è intero
                        field.onChange(value === "" ? 0 : parseInt(value, 10)); 
                      }}
                      // FIX: Se il valore è null/undefined, mostriamo una stringa vuota
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ROW 4: Description (Textarea) - Full Width */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="description" 
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Descrizione Dettagliata</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Scrivi qui una descrizione completa del prodotto..."
                      className="resize-none min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* --- Sezione Immagini & Vetrina --- */}
          
          {/* ROW 5: Immagini - Full Width */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="images" 
              render={() => ( // Non usiamo field, usiamo images (watch)
                <FormItem className="w-full">
                  <FormLabel>Immagini Prodotto</FormLabel>
                  <FormDescription className="mb-2">
                    Carica fino a 5 immagini. Clicca su un&apos;immagine per
                    rimuoverla.
                  </FormDescription>
                  <Card>
                    <CardContent className="space-y-2 mt-2 min-h-48">
                      <div className="flex flex-wrap items-start gap-4">
                        {/* Visualizzazione e rimozione delle immagini */}
                        {Array.isArray(images) &&
                        images.length > 0
                          ? images.map((image: string, index: number) => (
                              <div
                                key={index}
                                className="relative group w-20 h-20 rounded-sm border cursor-pointer overflow-hidden"
                                onClick={() => handleRemoveImage(image)} 
                              >
                                <Image
                                  src={image}
                                  alt={`Immagine ${index + 1}`}
                                  className="object-cover transition-opacity duration-300 group-hover:opacity-50"
                                  fill
                                  sizes="80px" 
                                />
                                {/* Overlay di rimozione */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white text-xs font-semibold">
                                    Rimuovi
                                  </span>
                                </div>
                              </div>
                            ))
                          : null}

                        {/* Se ci sono meno di 5 immagini, mostra il pulsante di caricamento */}
                        {images.length < 5 && (
                          <div className="flex items-center justify-center w-20 h-20">
                            <FormControl>
                              <UploadButton
                                endpoint="imageUploader"
                                onClientUploadComplete={(
                                  res: { url: string }[]
                                ) => {
                                  // OK: newImages ha il tipo corretto (string[])
                                  const newImages = [
                                    ...(Array.isArray(images) ? images : []),
                                    res[0].url,
                                  ];
                                  form.setValue(
                                    "images",
                                    newImages, // Rimosso (as any)
                                    { shouldValidate: true, shouldDirty: true }
                                  );

                                  toast({
                                    description:
                                      "Immagine caricata con successo!",
                                  });
                                }}
                                onUploadError={(error: Error) => {
                                  toast({
                                    variant: "destructive",
                                    description: `Caricamento fallito: ${error.message}`,
                                  });
                                }}
                                content={{
                                  button: "Carica",
                                  allowedContent: "Max 4MB/file",
                                }}
                                appearance={{
                                  button:
                                    "bg-indigo-600 p-1 h-10 w-10 text-xs rounded-full ut-uploading:bg-indigo-500 ut-ready:opacity-100 ut-uploading:opacity-80 ut-ready:hover:bg-indigo-700 ut-ready:duration-100 ut-ready:transition-colors",
                                  container: "w-full max-w-none !m-0",
                                  allowedContent: "hidden",
                                }}
                              />
                            </FormControl>
                          </div>
                        )}
                      </div>
                      {images.length >= 5 && (
                        <p className="text-sm text-muted-foreground pt-4">
                          Numero massimo di immagini (5) raggiunto.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ROW 6: Is Featured (Vetrina) - Full Width e Struttura Semplificata */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="isFeatured" 
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="isFeatured"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel htmlFor="isFeatured">
                          Prodotto in Vetrina
                        </FormLabel>
                        <FormDescription>
                          Seleziona per mostrare questo prodotto nella sezione
                          &quot;In Vetrina&quot; del tuo negozio.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sezione Banner Condizionale */}
                {isFeatured && ( // Watchiamo isFeatured
                  <FormField
                    control={form.control}
                    name="banner" 
                    render={({ field }) => (
                      <div className="mt-6 border p-4 rounded-lg bg-gray-50/50">
                        <FormLabel className="text-sm font-semibold mb-3 text-indigo-700 block">
                          Banner Vetrina ({field.value ? "Presente" : "Non Caricato"})
                        </FormLabel>

                        {/* Visualizzazione del Banner (se esiste) */}
                        {field.value && (
                          <div className="mb-4">
                            <Image
                              src={field.value}
                              alt="Anteprima Banner"
                              className="w-full object-cover object-center rounded-lg shadow-md aspect-[16/6]"
                              width={1920}
                              height={680}
                              sizes="100vw"
                            />
                            {/* Bottone per rimuovere il banner */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveBanner}
                              className="mt-2"
                            >
                              Rimuovi Banner
                            </Button>
                          </div>
                        )}

                        {/* Pulsante di Caricamento */}
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res: { url: string }[]) => {
                            field.onChange(res[0].url); // Aggiornamento del campo "banner"
                            toast({
                              description: `Banner ${
                                field.value ? "sostituito" : "caricato"
                              } con successo!`,
                            });
                          }}
                          onUploadError={(error: Error) => {
                            toast({
                              variant: "destructive",
                              description: `Caricamento Banner fallito: ${error.message}`,
                            });
                          }}
                          content={{
                            button: field.value
                              ? "Sostituisci Banner"
                              : "Carica Banner Vetrina",
                            allowedContent: "Max 4MB/file (Solo 1 File)",
                          }}
                          appearance={{
                            button:
                              "[&>*]:text-white bg-green-600 hover:bg-green-700 p-2 h-8 ut-uploading:bg-green-500 ut-ready:opacity-100 ut-uploading:opacity-80 ut-ready:hover:bg-green-700 ut-ready:duration-100 ut-ready:transition-colors",
                            container: "w-full max-w-sm mx-auto",
                            allowedContent:
                              "text-xs text-muted-foreground mt-2 text-center",
                          }}
                        />
                        <FormMessage className="mt-2" />
                      </div>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* SUBMIT BUTTON FINALE */}
          <div className="md:col-span-2 flex justify-center pt-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white w-full max-w-sm md:max-w-xs"
            >
              {form.formState.isSubmitting
                ? "Invio in corso..."
                : type === "Create"
                ? "Crea Prodotto"
                : "Aggiorna Prodotto"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;