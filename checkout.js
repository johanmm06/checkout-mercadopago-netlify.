// ================================
// ESTADO GLOBAL CONTROLADO
// ================================
let mp = null;
let bricksBuilder = null;
let paymentBrickController = null;

// ================================
// INICIALIZAR MERCADO PAGO (1 SOLA VEZ)
// ================================
function initMercadoPago() {
    if (mp) return;

    if (!window.MercadoPago) {
        console.error("❌ SDK de MercadoPago no cargado");
        return;
    }

    mp = new MercadoPago("APP_USR-4342d87e-3fcf-467f-a748-6807c24eccfe", {
        locale: "es-CO",
    });

    bricksBuilder = mp.bricks();
}

// ================================
// RENDER PAYMENT BRICK
// ================================
async function renderPaymentBrick() {
    initMercadoPago();

    if (!bricksBuilder) return;
    if (paymentBrickController) return; 

    const settings = {
        initialization: {
            amount: 39900,
        },
        customization: {
            visual: {
                style: {
                    theme: "dark",
                    customVariables: {
                        textPrimaryColor: "#FFFFFF",
                        formBackgroundColor: "#0B1A2B",
                        inputBackgroundColor: "#0F2A44"
                    }
                }
            },
            paymentMethods: {
                maxInstallments: 1,
                ticket: "all",
                bankTransfer: "all",
                debitCard: "all",
            },
        },
        callbacks: {
            onReady: () => {
                console.log("✅ Interfaz lista");
                
                // MOSTRAMOS TODO AL TIEMPO
                const mainContent = document.getElementById("checkout-main-content");
                const badges = document.getElementById("checkout-trust-badges");
                
                if (mainContent) mainContent.classList.remove("hidden");
                if (badges) badges.classList.remove("hidden");
            },
            onError: (error) => {
                console.error("❌ Error en el Brick:", error);
            },
            // dentro de settings.callbacks
// ... dentro de settings.callbacks
onSubmit: async ({ formData }) => { // <--- ASEGÚRATE QUE DIGA 'onSubmit' CON UNA SOLA 'o'
    console.log("🚀 Enviando datos al servidor...", formData);
    try {
        const response = await fetch("/.netlify/functions/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                transaction_amount: 39900
            })
        });

        const result = await response.json();
        console.log("✅ Respuesta del servidor:", result);

        // Si el servidor devuelve error 500 o algo similar
        if (result.error) {
            console.error("❌ Error de MP:", result.error);
            alert("Error: " + result.error);
            return;
        }

        // LÓGICA DE REDIRECCIÓN
        const linkPago = result.point_of_interaction?.transaction_data?.ticket_url;
        const referenciaEfecty = result.transaction_details?.verification_code;

        if (result.payment_method_id === 'efecty' && referenciaEfecty) {
            window.location.href = `/resultado?estado=pendiente&referencia=${referenciaEfecty}`;
            return;
        }

        if (linkPago) {
            window.location.href = linkPago;
            return;
        }

        if (result.status === "approved") {
            window.location.href = "/resultado";
            return;
        }

    } catch (err) {
        console.error("❌ Error en la petición:", err);
    }
}
        },
    };

    paymentBrickController = await bricksBuilder.create(
        "payment",
        "paymentBrick_container",
        settings
    );
}
// DESTRUIR BRICK (OBLIGATORIO)
// ================================
function destroyPaymentBrick() {
    if (paymentBrickController) {
        paymentBrickController.unmount();
        paymentBrickController = null;
    }
}

// ================================
// EXPONER FUNCIONES AL HTML
// ================================
window.openCheckout = function () {
    const overlay = document.getElementById("checkout-overlay");
    if (!overlay) return;

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    renderPaymentBrick();
};

window.closeCheckout = function () {
    const overlay = document.getElementById("checkout-overlay");
    if (!overlay) return;

    overlay.classList.add("hidden");
    document.body.style.overflow = "auto";

    destroyPaymentBrick();
};
