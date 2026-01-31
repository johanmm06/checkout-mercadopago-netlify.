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

    mp = new MercadoPago("TEST-14929baf-8fde-43c5-875a-a1c6a708ed09", {
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
onSubmit: async ({ formData }) => {
            try {
                // 1. Preparamos los datos
                const payload = {
                    ...formData,
                    transaction_amount: 39900
                };

                // 2. Llamamos a tu función de Netlify
                const response = await fetch("/.netlify/functions/create-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                console.log("Datos recibidos de MP:", result);

                // 3. LA CLAVE: Redirección para PSE / Efecty
                const linkDePago = result.point_of_interaction?.transaction_data?.ticket_url;

                if (linkDePago) {
                    console.log("🚀 Redirigiendo al portal de pago...");
                    window.location.href = linkDePago; // Abre el banco o el recibo
                    return;
                }

                // 4. Caso para tarjetas aprobadas inmediatamente
                if (result.status === "approved") {
                    window.location.href = "https://accesocursocel.netlify.app/resultado";
                    return;
                }

                // 5. Si algo falló
                if (result.error || result.status === "rejected") {
                    alert("El pago fue rechazado. Por favor, intenta con otro medio.");
                }

            } catch (err) {
                console.error("❌ Error en el proceso de pago:", err);
                alert("Hubo un error técnico. Revisa la consola.");
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
