import { generateAccessToken, paypal, buildPayPalPayload } from "@/lib/paypal";

describe("PayPal Service Integration & Unit Tests", () => {
  // Test per generare Token di accesso Paypal
  test("Generiamo un token da Paypal", async () => {
    const tokenResponse = await generateAccessToken();
    expect(typeof tokenResponse).toBe("string");
    expect(tokenResponse.length).toBeGreaterThan(20);
  });

  // Test per la costruzione del payload PayPal
  test("Costruzione corretta del payload PayPal per il checkout", () => {
    const totals = { itemsPrice: 50.0, shippingPrice: 5.0, taxPrice: 11.0 };
    const items = [{ name: "T-Shirt Modern", price: 50.0, qty: 1 }];
    const payload = buildPayPalPayload(totals, items);

    expect(payload.intent).toBe("CAPTURE");
    expect(payload.purchase_units[0].amount.value).toBe("66.00");
    expect(payload.purchase_units[0].items).toHaveLength(1);
    expect(payload.purchase_units[0].items?.[0].name).toBe("T-Shirt Modern");
  });

  // Test per creare un ordine Paypal
  test("Creiamo un ordine paypal con mock", async () => {
    const price = 10.0;
    const mockCreateOrder = jest.spyOn(paypal, "createOrder").mockResolvedValue({
      id: "MOCK-ORDER-12345",
      status: "CREATED",
    });

    const orderResponse = await paypal.createOrder(price);

    expect(orderResponse).toHaveProperty("id", "MOCK-ORDER-12345");
    expect(orderResponse).toHaveProperty("status", "CREATED");

    mockCreateOrder.mockRestore();
  });

  // Test per catturare un pagamento con un ordine
  test("Simuliamo la cattura del pagamento di un ordine", async () => {
    const orderId = "MOCK-ORDER-12345";

    const mockCapturePayment = jest.spyOn(paypal, "capturePayment").mockResolvedValue({
      id: orderId,
      status: "COMPLETED",
    });

    const captureResponse = await paypal.capturePayment(orderId);
    expect(captureResponse).toHaveProperty("status", "COMPLETED");

    mockCapturePayment.mockRestore();
  });
});
