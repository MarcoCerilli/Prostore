import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Usiamo l'interfaccia completa necessaria per la UI.
interface shippingAddress {
  firstName: string;
  lastName: string;
  street: string; // Via
  houseNumber: string; // Numero Civico (es. '12B')
  city: string;
  postalCode: string; // ✅ CORRETTO: Usa postalCode
  country: string; // Nazione
  phoneNumber: string; // Telefono
}

interface ShippingAddressFormProps {
  address: shippingAddress;
  onSave: (address: shippingAddress) => void;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({
  address,
  onSave,
}) => {
  // Inizializziamo lo stato con l'indirizzo esistente passato come prop
  const [addressDetails, setAddressDetails] =
    useState<shippingAddress>(address);
  const [isAttemptedSubmit, setIsAttemptedSubmit] = useState(false);

  // Funzione per validare se tutti i campi sono non vuoti
  const isFormComplete = () => {
    // NOTA: Controlliamo solo i campi che usiamo nel form.
    // L'uso di Object.values(addressDetails) è sconsigliato se il tipo può avere campi opzionali o non mappati.
    // Li elenchiamo esplicitamente per sicurezza
    return (
      addressDetails.firstName.trim() !== "" &&
      addressDetails.lastName.trim() !== "" &&
      addressDetails.street.trim() !== "" &&
      addressDetails.houseNumber.trim() !== "" &&
      addressDetails.city.trim() !== "" &&
      addressDetails.postalCode.trim() !== "" && // ✅ Usa postalCode
      addressDetails.country.trim() !== "" &&
      addressDetails.phoneNumber.trim() !== ""
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressDetails({
      ...addressDetails,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAttemptedSubmit(true);

    if (isFormComplete()) {
      // Chiamiamo onSave con i dati completi raccolti dal form
      onSave(addressDetails);
    }
  };

  return (
    <Card className="md:col-span-2 shadow-lg">
      <CardHeader>
        <CardTitle>Indirizzo di Spedizione</CardTitle>
        <CardDescription>
          Inserisci dove desideri ricevere i tuoi prodotti e un recapito
          telefonico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Riga 1: Nome e Cognome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={addressDetails.firstName}
                onChange={handleChange}
                required
                className={
                  isAttemptedSubmit && !addressDetails.firstName
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input
                id="lastName"
                value={addressDetails.lastName}
                onChange={handleChange}
                required
                className={
                  isAttemptedSubmit && !addressDetails.lastName
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
          </div>

          {/* Riga 2: Via e Numero Civico */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="street">Via</Label>
              <Input
                id="street"
                value={addressDetails.street}
                onChange={handleChange}
                required
                className={
                  isAttemptedSubmit && !addressDetails.street
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="houseNumber">N. Civico</Label>
              <Input
                id="houseNumber"
                value={addressDetails.houseNumber}
                onChange={handleChange}
                required
                className={
                  isAttemptedSubmit && !addressDetails.houseNumber
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
          </div>

          {/* Riga 3: Città e CAP (postalCode) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                value={addressDetails.city}
                onChange={handleChange}
                required
                className={
                  isAttemptedSubmit && !addressDetails.city
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">CAP</Label>
              <Input
                id="postalCode"
                value={addressDetails.postalCode} // ✅ CORRETTO: Binding a postalCode
                onChange={handleChange}
                required
                maxLength={5}
                className={
                  isAttemptedSubmit && !addressDetails.postalCode
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
          </div>

          {/* Riga 4: Nazione e Telefono */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Nazione</Label>
              <Input
                id="country"
                value={addressDetails.country}
                onChange={handleChange}
                required
                className={
                  isAttemptedSubmit && !addressDetails.country
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefono</Label>
              <Input
                id="phoneNumber"
                value={addressDetails.phoneNumber}
                onChange={handleChange}
                required
                type="tel"
                className={
                  isAttemptedSubmit && !addressDetails.phoneNumber
                    ? "border-red-500"
                    : ""
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            // ✅ CLASSI AGGIORNATE: bg-indigo-600 per coerenza
            className="w-full text-lg h-12 bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg font-semibold"
            disabled={!isFormComplete()}
          >
            Conferma e Continua al Pagamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShippingAddressForm;
