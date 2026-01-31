import { MercadoPagoConfig, Payment } from 'mercadopago';

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN
    });

    const payment = new Payment(client);
    const data = JSON.parse(event.body);

    const baseBody = {
      transaction_amount: Number(data.transaction_amount),
      description: "Acceso al curso Técnico Elite",
      payment_method_id: data.payment_method_id,
      payer: {
        email: data.payer.email,
        first_name: data.payer.first_name,
        last_name: data.payer.last_name,
        identification: {
          type: data.payer.identification.type,
          number: data.payer.identification.number
        }
      }
    };

    // 💳 TARJETA
    if (data.payment_method_id === "visa" || data.payment_method_id === "master") {
      baseBody.token = data.token;
      baseBody.installments = Number(data.installments || 1);
      baseBody.issuer_id = data.issuer_id;
    }

    // 🏦 PSE / 🧾 EFECTY
    // NO token, NO installments, NO issuer

    const response = await payment.create({ body: baseBody });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error("❌ Error MP:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        cause: error.cause
      })
    };
  }
};
