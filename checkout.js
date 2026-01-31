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
    const payload = {
      ...formData,
      transaction_amount: 39900
    };

    const response = await fetch("/.netlify/functions/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // ... dentro de tu fetch a la función de Netlify ...
const result = await response.json();

if (result.status === "pending" || result.status === "in_process") {
    // 🔗 ESTA ES LA CLAVE: Buscamos la URL de redirección
    const redirectUrl = result.point_of_interaction?.transaction_data?.ticket_url;

    if (redirectUrl) {
        // Opción A: Abrir en la misma pestaña (Recomendado para PSE)
        window.location.href = redirectUrl; 
        
        // Opción B: Abrir en pestaña nueva (Útil si quieres que tu web siga abierta)
        // window.open(redirectUrl, '_blank');
    } else {
        // Si por alguna razón no hay URL, mandamos a tu página de espera
        window.location.href = "https://accesocursocel.netlify.app/pendiente";
    }
    return;
}

    // 3. CASO RECHAZADO
    alert("El pago fue rechazado o falló. Intenta de nuevo.");

  } catch (err) {
    console.error("Error en onSubmit:", err);
    alert("Hubo un error técnico al procesar el pago.");
  }
},

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
