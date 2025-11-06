const base = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

export const paypal = {
  //creiamo un ordine all interno dell oggetto paypal
  createOrder: async function createOrder(price: number) {
    const accessToken = await generateAccessToken;
    const url = `${base}/v2/checkout/orders`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_unit: [
          {
            amount: {
              currency_code: "EUR",
              value: price,
            },
          },
        ],
      }),
    });
    handleResponse(response);
  },
  capturePayment: async function capturePayment(orderId: string) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/{id}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse(response);
  },
};

// Generiamo AccessToken Paypal

async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString(
    "base64"
  );

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "post",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const jsonData = await handleResponse(response);
  return jsonData.access_token;
}

async function handleResponse(response: Response) {
  if (response.ok) {
    return await response.json();
  } else {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

export { generateAccessToken };

/* // Nome 'myAge' : Tipo 'number'
let myAge: number = 30;

// Nome 'user' : Tipo 'UserInterface'
function processUser(user: UserInterface) { ... } */
