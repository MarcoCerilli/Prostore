"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { productDefaultValues } from "@/lib/constants";
import { insertProductschema, updateProductSchema } from "@/lib/validators";
import { Product } from "@/types";
import { useRouter } from "next/navigation";
import {
  ControllerRenderProps,
  SubmitHandler,
  useForm,
  // ⭐️ NOTA: Non serve FieldValues se FormSchemaType è correttamente definito
  FieldValues,
} from "react-hook-form";
import z from "zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
  FormDescription,
  FormControl,
}
// Assicurati che questo import sia corretto per i tuoi componenti di form
from "../ui/form";
import slugify from "slugify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { UploadButton } from "@/lib/uploadthing";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";

// Definisci il tipo dello schema del form in base al contesto.
// Usiamo la logica dello schema dinamico
type FormSchemaType = z.infer<typeof insertProductschema> | z.infer<typeof updateProductSchema>;



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
  const schema = type === "Update" ? updateProductSchema : insertProductschema;
  
  // 2. LOGICA DEI DEFAULT VALUES
  const defaultValues =
    product && type === "Update"
      ? ({
          ...product,
          images: product.images || [],
          isFeatured: product.isFeatured ?? false,
          banner: product.banner || "",
        } as FormSchemaType) // Casting a FormSchemaType
      : ({
          ...productDefaultValues,
          images: [],
          isFeatured: false,
          banner: "",
          // ⚠️ FIX PER IL PREZZO: Zod number non accetta undefined
          price: (productDefaultValues.price || 0), 
          stock: (productDefaultValues.stock || 0),
        } as FormSchemaType); // Casting a FormSchemaType

  // 3. useForm con il tipo dinamico
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues,
  });

  const onSubmit: SubmitHandler<FormSchemaType> = async (values) => {
    // La logica di onSubmit è corretta
    const action = type === "Create" ? createProduct(values as z.infer<typeof insertProductschema>) : updateProduct({
        ...values,
        id: productId!,
      } as z.infer<typeof updateProductSchema> & { id: string });

    const res = await action;

    if (!res.success) {
      toast({ variant: "destructive", description: res.message });
    } else {
      toast({ description: res.message });
      router.push("/admin/products");
    }
  };

  const images = form.watch("images") as string[];
  // isFeatured viene watchato più in basso.

  // Funzione helper per la rimozione dell'immagine
  const handleRemoveImage = (urlToRemove: string) => {
    const newImages = images.filter((img: string) => img !== urlToRemove);
    // ✅ OK: Casting esplicito del valore in FormSchemaType['images']
    form.setValue("images", newImages as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
    toast({ description: "Immagine rimossa." });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Non è necessario il casting (as any) se l'import di Form è corretto e `useForm` è tipizzato */}
      <Form {...form}>
        <form
          method="POST"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
        >
          {/* ROW 1: Nome & Slug (50/50) */}
          <div className="md:col-span-1">
            {/* Nome */}
            <FormField
              name="name" // ✅ CORRETTO
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
            {/* Slug */}
            <FormField
              name="slug" // ✅ CORRETTO
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
                      onClick={() => {
                        const name = form.getValues("name");
                        if (name) {
                          const slug = slugify(name, {
                            lower: true,
                            strict: true,
                          });
                          // ✅ OK: Setting del valore dello slug
                          form.setValue("slug", slug as any, { 
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
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
            {/* Category */}
            <FormField
              name="category" // ✅ CORRETTO
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
di nulla

          <div className="md:col-span-1">
            {/* Brand */}
            <FormField
              name="brand" // ✅ CORRETTO
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
            {/* Price */}
            <FormField
              name="price" // ✅ CORRETTO
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Prezzo (€)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="99.99"
                      {...field}
                      type="number"
                      className="h-10"
                      // FIX: Gestione della conversione del valore per input numerico (necessario per input type="number" di react-hook-form)
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : Number(value));
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-1">
            {/* Stock */}
            <FormField
              name="stock" // ✅ CORRETTO
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Giacenza (Quantità Disponibile)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Inserisci la disponibilità in magazzino"
                      {...field}
                      type="number"
                      className="h-10"
                      // FIX: Gestione della conversione del valore per input numerico
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : Number(value));
                      }}
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
              name="description" // ✅ CORRETTO
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Descrizione Dettagliata</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Scrivi qui una descrizione completa del prodotto, evidenziando le caratteristiche principali e i benefici per il cliente."
                      className="resize-none min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ROW 5: Immagini - Full Width */}
          <div className="md:col-span-2">
            <FormField
              name="images" // ✅ CORRETTO
              render={() => (
                <FormItem className="w-full">
                  <FormLabel>Immagini Prodotto</FormLabel>
                  <FormDescription className="mb-2">
                    Carica fino a 5 immagini. Clicca su un'immagine per
                    rimuoverla.
                  </FormDescription>
                  <Card>
                    <CardContent className="space-y-2 mt-2 min-h-48">
                      <div className="flex flex-wrap items-start gap-4">
                        {/* Visualizzazione e rimozione delle immagini */}
                        {images &&
                        Array.isArray(images) &&
                        images.length > 0
                          ? images.map((image: string, index: number) => (
                              <div
                                key={index}
                                className="relative group w-20 h-20 rounded-sm border cursor-pointer overflow-hidden"
                                onClick={() => handleRemoveImage(image)} // Rimuovi al click
                              >
                                <Image
                                  src={image}
                                  alt={`Immagine ${index + 1}`}
                                  className="object-cover transition-opacity duration-300 group-hover:opacity-50"
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                                  form.setValue(
                                    "images",
                                    [
                                      ...(Array.isArray(images) ? images : []),
                                      res[0].url,
                                    ] as any, // Casting a any per il valore dell'array
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
                  name="isFeatured" // ✅ CORRETTO
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
                          "In Vetrina" del tuo negozio (come un prodotto in
                          evidenza).
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sezione Banner Condizionale */}
                {form.watch("isFeatured") && ( // Watchiamo isFeatured
                  <FormField
                    name="banner" // ✅ CORRETTO
                    render={({ field }) => (
                      <div className="mt-6 border p-4 rounded-lg bg-gray-50/50">
                        <FormLabel className="text-sm font-semibold mb-3 text-indigo-700 block">
                          Banner Vetrina ({field.value ? "Presente" : "Non Caricato"})
                        </FormLabel>

                        {/* Visualizzazione del Banner (se esiste) */}
                        {field.value && (
                          <div className="mb-4">
                            <Image
                              src={field.value as string}
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
                              onClick={() => {
                                // ✅ OK: Setting del valore del banner a stringa vuota (che Zod preprocessa a null)
                                form.setValue("banner", "" as any, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                toast({ description: "Banner rimosso." });
                              }}
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