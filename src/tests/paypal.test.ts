import { generateAccessToken } from "@/lib/paypal";


// Test per generare Token di accesso Paypal
test("Generiamo un token da Paypal", async() => {
    const tokenResponse = await generateAccessToken();
    console.log(tokenResponse);
    expect(typeof tokenResponse).toBe('string');
    expect( tokenResponse.length).toBeGreaterThan(20);

})
