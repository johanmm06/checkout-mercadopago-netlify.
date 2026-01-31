  import { MercadoPagoConfig, Payment } from "mercadopago";

  export const handler = async (event) => {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "OK" };
    }
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "No body received" }),
    };
  }

    try {
      const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN  
  });


      const payment = new Payment(client);
      const data = JSON.parse(event.body);

    const ip =
    event.headers["x-forwarded-for"]?.split(",")[0] ||
    event.headers["client-ip"] ||
    "127.0.0.1";
  const response = await payment.create({
  body: {
    transaction_amount: data.transaction_amount,
    token: data.token,
    description: "Acceso al curso Técnico Elite",
    installments: data.installments,
    payment_method_id: data.payment_method_id,
    issuer_id: data.issuer_id,
    payer: {
      email: data.payer.email,
      identification: data.payer.identification
    },
    // AQUÍ ESTÁ EL CAMBIO: Se envían como parámetros de la preferencia o raíz según la versión
    // Si usas Bricks, MP espera que la redirección se maneje así:
    callback_url: "https://accesocursocel.netlify.app/resultado",
    notification_url: "https://accesocursocel.netlify.app/.netlify/functions/webhooks", // Opcional
    
    // Estos campos a veces causan conflicto en el SDK v2 si no están en una "Preference"
    // Vamos a intentar enviarlos así para que el servidor los acepte:
    additional_info: {
      ip_address: ip,
    },
  },
});


      // ... (resto del código arriba igual)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response), // Aquí envías la respuesta completa si todo salió bien
    };
  } catch (error) {
    console.error("❌ MP ERROR:", error);
    return {
      statusCode: 500, // Si falla, avisamos que hubo un error
      headers,
      body: JSON.stringify({
        error: error.message,
        cause: error.cause
      }),
    };
  }
};
    