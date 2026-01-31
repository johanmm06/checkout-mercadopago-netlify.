import { MercadoPagoConfig, Payment } from "mercadopago";

export const handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "OK" };

    try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const payment = new Payment(client);
        const data = JSON.parse(event.body);

        // Limpiamos el objeto según el método de pago
        const paymentData = {
            transaction_amount: Number(data.transaction_amount),
            description: "Acceso al curso Técnico Elite",
            payment_method_id: data.payment_method_id,
            payer: {
                email: data.payer.email,
                identification: {
                    type: data.payer.identification.type,
                    number: data.payer.identification.number
                },
                entity_type: data.payer.entity_type || "individual",
            },
            callback_url: "https://accesocursocel.netlify.app/resultado",
        };

        // Si es tarjeta, agregamos el token. Si es PSE/Efecty, NO.
        if (data.token) {
            paymentData.token = data.token;
            paymentData.installments = Number(data.installments);
        }

        // Para PSE es obligatorio el issuer_id
        if (data.issuer_id) {
            paymentData.issuer_id = data.issuer_id;
        }

        // Metadata para control tuyo
        paymentData.metadata = { curso: "Tecnico Elite" };

        const response = await payment.create({ body: paymentData });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };

    } catch (error) {
        console.error("❌ MP ERROR:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message || "Error interno",
                cause: error.cause || []
            }),
        };
    }
};