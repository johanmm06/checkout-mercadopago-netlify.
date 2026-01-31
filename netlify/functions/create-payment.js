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

        const ip = event.headers["x-forwarded-for"]?.split(",")[0] || event.headers["client-ip"] || "127.0.0.1";

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
                    identification: data.payer.identification,
                    // Solución para PSE
                    entity_type: data.payer.entity_type || "individual",
                    type: data.payer.type || "customer"
                },
                callback_url: "https://accesocursocel.netlify.app/resultado",
                additional_info: {
                    ip_address: ip,
                },
            },
        });

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
                error: error.message,
                cause: error.cause
            }),
        };
    }
};