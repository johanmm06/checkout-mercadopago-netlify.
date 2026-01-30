import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);

    const payment = await mercadopago.payment.save({
      transaction_amount: data.transaction_amount,
      token: data.token,
      description: "Acceso al curso",
      installments: 1,
      payment_method_id: data.payment_method_id,
      payer: {
        email: data.payer.email
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: payment.status
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

