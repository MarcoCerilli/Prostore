import { generateAccessToken, paypal} from "@/lib/paypal";


// Test per generare Token di accesso Paypal
test("Generiamo un token da Paypal", async() => {
    const tokenResponse = await generateAccessToken();
    console.log(tokenResponse);
    expect(typeof tokenResponse).toBe('string');
    expect( tokenResponse.length).toBeGreaterThan(20);

})

//Test per creare un ordine Paypal
test('Creiamo un ordine paypal', async () => {
const token = await generateAccessToken()
const price = 10.0

const orderResponse = await paypal.createOrder(price)
console.log(orderResponse)

expect(orderResponse).toHaveProperty('id')
expect(orderResponse).toHaveProperty('status')
expect(orderResponse.status).toBe('CREATED')
} ) 

// Test per catturare un pagamento con un ordine

test('Simuliamo un pagamento di un ordine', async () => {
    const orderId: string = "100";

    const mockCapturePayment = jest
    .spyOn(paypal, 'capturePayment')
    .mockResolvedValue({
        status: 'COMPLETED',
    })

    const captureResponse = await paypal.capturePayment(orderId);
    expect (captureResponse).toHaveProperty('status', 'COMPLETED')


    mockCapturePayment.mockRestore();


})
