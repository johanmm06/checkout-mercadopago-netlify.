import { MercadoPagoConfig, Payment } from 'mercadopago';

export const handler = async (event) => {
    // 1. Manejo de CORS
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
        // USAMOS LA VARIABLE QUE TIENES EN NETLIFY
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN 
        });
        
        const payment = new Payment(client);
        const data = JSON.parse(event.body);

        // Estructura obligatoria para la Versión 2.x
        const body = {
            transaction_amount: Number(data.transaction_amount),
            token: data.token,
            description: "Acceso al curso Técnico Elite",
            installments: Number(data.installments || 1),
            payment_method_id: data.payment_method_id,
            issuer_id: data.issuer_id,
            payer: {
                email: data.payer.email
            }
        };

        const response = await payment.create({ body });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: response.status,
                id: response.id
            })
        };

    } catch (error) {
        console.error("❌ Error MP:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message,
                details: error.cause 
            })
        };
    }
};