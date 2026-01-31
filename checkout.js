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
onSubmit: async ({ formData }) => {
    console.log("1. Botón presionado. Datos capturados:", formData);
    
    try {
        console.log("2. Enviando petición a Netlify...");
        const response = await fetch("/.netlify/functions/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                transaction_amount: 39900
            })
        });

        console.log("3. Respuesta recibida del servidor, procesando JSON...");
        const result = await response.json();
        // ... (Paso 4: Resultado final)
        console.log("4. Resultado final:", result);

        // BUSCADOR DE LINK DE PSE (Intenta varias rutas)
        const linkPSE = result.point_of_interaction?.transaction_data?.ticket_url || 
                        result.transaction_details?.external_resource_url ||
                        result.point_of_interaction?.transaction_data?.external_resource_url;

        const referenciaEfecty = result.transaction_details?.verification_code;

        // Caso Efecty
        if (result.payment_method_id === 'efecty' && referenciaEfecty) {
            console.log("🚀 Redirigiendo a página de Efecty...");
            window.location.href = `/resultado?estado=pendiente&referencia=${referenciaEfecty}`;
            return;
        }

        // Caso PSE
        if (linkPSE) {
            console.log("🚀 Link de PSE encontrado. Redirigiendo a:", linkPSE);
            window.location.href = linkPSE; // ESTO ABRE EL BANCO
            return;
        }

        // Caso Tarjeta Aprobada
        if (result.status === "approved") {
            window.location.href = "/resultado";
            return;
        }

    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN FETCH:", err);
        alert("Hubo un problema de conexión. Revisa la consola.");
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

// ================================
// EXPONER FUNCIONES AL HTML
// ================================
window.openCheckout = function () {
    const overlay = document.getElementById("checkout-overlay");
    const whatsappBtn = document.querySelector(".whatsapp-float"); // Detecta el botón de WhatsApp
    
    if (!overlay) return;

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Bloquea el scroll del fondo
    
    // 🕵️ Ocultar WhatsApp al abrir el checkout
    if (whatsappBtn) {
        whatsappBtn.style.display = "none";
    }

    renderPaymentBrick();
};

window.closeCheckout = function () {
    const overlay = document.getElementById("checkout-overlay");
    const whatsappBtn = document.querySelector(".whatsapp-float");
    
    if (!overlay) return;

    overlay.classList.add("hidden");
    document.body.style.overflow = "auto"; // Libera el scroll
    
    // 🟢 Mostrar WhatsApp de nuevo al cerrar
    if (whatsappBtn) {
        whatsappBtn.style.display = "flex";
    }

    destroyPaymentBrick();
};