require('dotenv').config()


/* ha due scopi principali:

Caricare Variabili d'Ambiente: Il modulo dotenv legge il tuo file .env (o .env.test, se lo hai) 
e carica tutte le variabili d'ambiente (come PAYPAL_CLIENT_ID, PAYPAL_SECRET) nel processo Node.js che esegue Jest.

Accesso ai Secreti: Senza questo file di setup, quando il tuo test sul token PayPal tenta di leggere process.env.PAYPAL_CLIENT_ID, 
troverebbe la variabile vuota (undefined), e il test fallirebbe immediatamente.*/