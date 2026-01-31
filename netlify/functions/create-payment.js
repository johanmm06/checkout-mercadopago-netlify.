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
      ...data,
      description: "Acceso al curso Técnico Elite",
      // 💡 SOLUCIÓN: Usamos una URL de producción temporal o una válida
      // Mercado Pago aceptará esta aunque estés en localhost
      callback_url: "https://accesocursocel.netlify.app/resultado", 
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
    