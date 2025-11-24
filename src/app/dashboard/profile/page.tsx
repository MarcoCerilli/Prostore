import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "@/components/forms/ProfileForm"; 
import PasswordForm from "@/components/forms/PasswordForm"; 
import { Separator } from "@/components/ui/separator";
import { getFullUser } from "@/lib/actions/user.actions"; // Importazione corretta


// Componente Server-Side per la Pagina
export default async function ProfilePage() {

    // ⭐ 1. RECUPERA SOLO L'UTENTE COMPLETO DAL DB
    const user = await getFullUser();

    // 2. CONTROLLO DI AUTENTICAZIONE (basato sul risultato del DB/sessione)
    if (!user) {
        redirect('/sign-in');
    }
    

    return (
        <div className="space-y-8 p-4 md:p-8 w-full max-w-4xl mx-auto">
            
            <header>
                <h1 className="text-3xl font-bold tracking-tight">
                    {/* user.name o user.email sono sicuri */}
                    Ciao, {user.name || user.email || 'Utente'} 👋
                </h1>
                <p className="text-muted-foreground">
                    Gestisci le impostazioni del tuo account e aggiorna le tue informazioni personali.
                </p>
            </header>

            <Separator />
            
            {/* Sezione 1: Informazioni Personali */}
            <section id="personal-info">
                <h2 className="text-2xl font-semibold mb-4">Dettagli del Profilo</h2>
                
                <Card className="max-w-4xl">
                    <CardHeader>
                        <CardTitle>Aggiorna Informazioni</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Ora user contiene 'address' e soddisfa i tipi del form */}
                        <ProfileForm user={user} /> 
                    </CardContent>
                </Card>
            </section>
            
            {/* Sezione 2: Sicurezza (Cambio Password) */}
            <section id="security">
                <h2 className="text-2xl font-semibold mb-4 mt-8">Sicurezza Account</h2>
                
                <Card className="max-w-4xl">
                    <CardHeader>
                        <CardTitle>Cambia Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* user.password è garantito esistere da getFullUser */}
                        {user.password !== null ? (
                            <PasswordForm userId={user.id} />
                        ) : (
                            <p className="text-sm text-gray-500">
                                Hai effettuato l'accesso tramite un provider esterno (es. Google). Non è necessaria una password.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Sezione 3: Link agli Ordini (Accesso alla lista che abbiamo appena sistemato) */}
            <section id="orders-link">
                <h2 className="text-2xl font-semibold mb-4 mt-8">I Miei Ordini</h2>
                
                <Card className="max-w-4xl p-6 flex justify-between items-center bg-blue-50/50">
                    <p className="text-lg font-medium">Visualizza lo storico completo dei tuoi ordini.</p>
                    <a 
                        href="/dashboard/profile/orders" 
                        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700"
                    >
                        Vai agli Ordini &rarr;
                    </a>
                </Card>
            </section>
        </div>
    );
}