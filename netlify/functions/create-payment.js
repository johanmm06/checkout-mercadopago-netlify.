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

        // Capturar IP (Obligatorio para PSE)
        const ip = event.headers["x-forwarded-for"]?.split(",")[0] || 
                   event.headers["client-ip"] || 
                   "186.155.10.10"; 

        const paymentData = {
            transaction_amount: Number(data.transaction_amount),
            description: "Acceso al curso Técnico Elite",
            payment_method_id: data.payment_method_id,
            payer: {
                email: data.payer?.email,
                identification: {
                    type: data.payer?.identification?.type || "CC",
                    number: data.payer?.identification?.number || "0"
                },
                entity_type: data.payer?.entity_type || "individual",
            },
            additional_info: {
                ip_address: ip
            },
            callback_url: "https://cursonexodigital.netlify.app/resultado",
        };

        // Si es Tarjeta
        if (data.token) {
            paymentData.token = data.token;
            paymentData.installments = Number(data.installments);
        }

        // Si es PSE
        if (data.payment_method_id === 'pse') {
            paymentData.transaction_details = {
                financial_institution: data.transaction_details?.financial_institution
            };
        }

        const response = await payment.create({ body: paymentData });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };

    } catch (error) {
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