// Qui gestiamo lo stato del dialogo e l'interazione dell'utente 

"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
/** ID dell'elemento da eliminare */
  id: string;
  /**
   * FUNZIONE CHE ESEGUE L'AZIONE DI  ELIMINAZIONE, ACCETTANDO L'ID E RESTITUENDO UNA PROMISE
   */

action: (id: string) => (Promise<any>);

title: string;
description: string;
triggerText?: string;
}

export function DeleteDialog({
    id, 
    action,
  title = "Sei sicuro?",
  description = "Questa azione non può essere annullata",
  triggerText = "Elimina",
}: DeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
     //CHIAMA LA NUOA PROPRIETA' ACTION PASSANDO L' ID   
      await action(id);
      setOpen(false); // Chiude il dialogo dopo l'eliminazione
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      // Puoi aggiungere una notifica di errore qui
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {/* Il bottone che apre il dialogo, con stile distruttivo */}
        <Button variant="destructive">{triggerText}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Bottone Annulla */}
          <AlertDialogCancel disabled={isLoading}>Annulla</AlertDialogCancel>
          
          {/* Bottone di Conferma Elimina */}
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700" // Stile distruttivo forzato
          >
            {isLoading ? "Eliminazione..." : "Conferma Eliminazione"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


