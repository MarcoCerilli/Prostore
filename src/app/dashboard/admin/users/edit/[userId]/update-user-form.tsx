"use client";

import { useToast } from "@/hooks/use-toast";
import { updateUserSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

// Componenti e costanti
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { USER_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { updateUserBaseData } from "@/lib/actions/user.actions"; 

// Tipizzazione
type UserformType = z.infer<typeof updateUserSchema>;

interface Props {
  user: UserformType;
}

const UpdateUserForm = ({ user }: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<UserformType>({
    resolver: zodResolver(updateUserSchema as any),
    defaultValues: user as UserformType, 
  });

  const onSubmit = async (data: UserformType) => {
    const res = await updateUserBaseData(data);

    if (!res.success) {
      toast({
        variant: "destructive",
        description: res.message || "Aggiornamento utente fallito.",
      });
    } else {
      toast({
        description: res.message || "Utente aggiornato con successo!",
      });
      router.refresh(); 
      router.push("/dashboard/admin/users"); 
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6"> 
      <Form {...form}>
        <form
          method="POST"
          onSubmit={form.handleSubmit(onSubmit) as any} 
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
        >
          {/* Campo Email (Disabilitato) */}
          <div className="md:col-span-2"> 
            <FormField
              control={form.control as any} 
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled placeholder="Email utente" className="h-10 bg-gray-100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Campo Nome */}
          <div className="md:col-span-1">
            <FormField control={form.control as any} name="name" render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome utente" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
          </div>
          
          {/* Campo Ruolo */}
          <div className="md:col-span-1">
            <FormField control={form.control as any} name="role" render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ruolo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Seleziona il ruolo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
            )}/>
          </div>

          {/* Campo Password */}
          <div className="md:col-span-2"> 
            <FormField control={form.control as any} name="password" render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Password (Lascia vuoto per non modificare)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Nuova Password" className="h-10" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
          </div>

          {/* Bottone di Submit */}
          <div className="md:col-span-2 flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white w-full max-w-sm md:max-w-xs"
            >
              {isSubmitting ? ("Aggiornamento in corso...") : ("Aggiorna Utente")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UpdateUserForm;