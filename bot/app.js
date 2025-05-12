const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const axios = require("axios");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");

const flowSecundario = addKeyword(["2", "siguiente"]).addAnswer([
  "📄 Aquí tenemos el flujo secundario",
]);

const flowEscribenos = addKeyword(["4", "escríbenos", "escribenos"]).addAnswer(
  "✍️ Por favor, escribe tu pregunta:",
  { capture: true },
  async (ctx, { flowDynamic, fallBack }) => {
    const pregunta = ctx.body;

    try {
      const res = await axios.post("http://ia-api:8000/responder", {
        pregunta,
      });

      const respuestaIA =
        res.data.respuesta || "🤖 Lo siento, no pude procesar tu pregunta.";

      await flowDynamic([
        respuestaIA,
        "También puedes escribirnos al 📧 contacto@municipalidad.cl si necesitas ayuda humana.",
        "💬 ¿Tienes otra duda? Escríbela ahora o escribe *volver* para regresar al menú principal.",
      ]);

      return fallBack();
    } catch (err) {
      console.error("Error al consultar la IA:", err);
      await flowDynamic(["❌ Error al conectar con la IA. Intenta más tarde."]);
    }
  }
);

const flowVolver = addKeyword(["volver", "Volver al menú", "menu"]).addAnswer([
  "🙌 Hola Vecino",
  "📋 *Menú de ayuda:*",
  "1️⃣ *pago* permiso de circulación",
  "2️⃣ *cesfam* confirmación de horas CESFAM",
  "3️⃣ *faq* preguntas frecuentes",
]);

const flowPago = addKeyword(["1", "pago"])
  .addAnswer(
    "🔍 Por favor, ingresa tu *patente* (ej: ABCD12):",
    { capture: true },
    async (ctx, { flowDynamic }) => {
      const patente = ctx.body.trim().toUpperCase();

      // Validar formato tipo ABCD12
      if (!/^[A-Z]{2,4}\d{2,4}$/.test(patente)) {
        await flowDynamic([
          "⚠️ El formato ingresado no parece una patente válida. Ejemplo: ABCD12",
        ]);
        return;
      }

      const url = `https://www.sem2.gob.cl/tramites/permisos-de-circulacion/buscar/${patente}`;
      await flowDynamic([
        `✅ ¡Gracias! Aquí puedes realizar el pago de tu permiso de circulación:`,
        `👉 *Haz clic aquí:* ${url}`,
      ]);
    }
  )
  .addAnswer("✳️ Escribe *volver* o *menu* para regresar al menú principal.");

const flowCesfam = addKeyword(["2", "cesfam", "Cesfam"])
  .addAnswer("🕓 pendiente de ver con vicho")
  .addAnswer("✳️ Escribe *volver* o *menu* para regresar al menú principal.");

const flowGracias = addKeyword(["gracias", "grac"]).addAnswer(
  [
    "🚀 Puedes aportar tu granito de arena a este proyecto",
    "[*opencollective*] https://opencollective.com/bot-whatsapp",
    "[*buymeacoffee*] https://www.buymeacoffee.com/leifermendez",
    "[*patreon*] https://www.patreon.com/leifermendez",
    "\n*2* Para siguiente paso.",
  ],
  null,
  null,
  [flowSecundario]
);

const flowDiscord = addKeyword(["discord"]).addAnswer(
  [
    "🤪 Únete al discord",
    "https://link.codigoencasa.com/DISCORD",
    "\n*2* Para siguiente paso.",
  ],
  null,
  null,
  [flowSecundario]
);

const flowFaq = addKeyword(["3", "faq"]).addAnswer([
  "❓ Selecciona el tema:",
  "✳️ Escribe *rentas* para ver preguntas sobre Rentas.",
  "✳️ Escribe *obras* para ver preguntas sobre Obras.",
]);

const flowFaqRentas = addKeyword(["rentas"]).addAnswer([
  "2.1 *Preguntas sobre Rentas*:",
  "🛍️ Escribe *ambulante* para Permiso ambulante.",
  "🏗️ Escribe *provisional* para Permiso Provisional.",
  "♻️ Escribe *descuento* para Descuento en derechos de aseo.",
  "🏪 Escribe *patente comercial* para Patente comercial.",
  "📢 Escribe *publicidad* para Publicidad en vía pública.",
  "📄 Escribe *deuda* para Certificado de deuda.",
  "📝 Escribe *actualización* para Actualización de patente.",
  "🧺 Escribe *venta* para Permiso de venta.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasAmbulante = addKeyword([
  "ambulante",
  "permiso ambulante",
]).addAnswer([
  "🛍️ *Permiso ambulante*:",
  "¿Cómo solicitar un permiso ambulante?",
  "Requiere reunir documentos (CI, residencia, formulario, RUT, antecedentes), completar el formulario en la municipalidad, entregar los antecedentes y esperar aprobación.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasProvisional = addKeyword([
  "provisional",
  "permiso provisional",
]).addAnswer([
  "🏗️ *Permiso Provisional*:",
  "¿Cómo solicito un Permiso provisional?",
  "Debes definir el tipo de actividad, reunir antecedentes (planos, identidad, residencia), completar formulario, pagar tasas y esperar evaluación.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasDescuento = addKeyword(["descuento", "aseo"]).addAnswer([
  "♻️ *Descuento en derechos de aseo*:",
  "¿Cómo obtengo un descuento?",
  "Presentar CI, certificado de residencia, documento de grupo prioritario y Registro Social de Hogares. La municipalidad evaluará si se otorga el beneficio.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasPatente = addKeyword(["patente comercial"]).addAnswer([
  "🏪 *Patente comercial*:",
  "¿Cómo solicito la patente municipal?",
  "Se requieren documentos específicos del negocio, presentación ante la Oficina de Rentas, pago de derechos, evaluación y renovación semestral.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasPublicidad = addKeyword([
  "publicidad",
  "vía pública",
  "via pública",
]).addAnswer([
  "📢 *Publicidad en vía pública*:",
  "¿Cómo solicito permiso de publicidad?",
  "Requiere croquis, descripción, autorización del dueño (si aplica), pago de derechos y aprobación por normativa.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasDeuda = addKeyword(["deuda", "certificado deuda"]).addAnswer([
  "📄 *Certificado de deuda*:",
  "¿Cómo solicito un certificado de deuda municipal?",
  "Presentar CI, RUT (si aplica), dirección, pagar derechos y esperar emisión del documento.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasActualizacion = addKeyword([
  "actualización",
  "actualizar patente",
]).addAnswer([
  "📝 *Actualización de patente*:",
  "¿Cómo actualizo mi patente comercial?",
  "Presentar documentación respaldatoria, completar formulario, pagar tasas (si aplica) y esperar aprobación.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqRentasVenta = addKeyword(["venta", "permiso venta"]).addAnswer([
  "🧺 *Permiso de venta*:",
  "¿Cómo solicitar un permiso de venta?",
  "Documentación del solicitante, descripción de productos, presentar formulario, pagar derechos y esperar revisión.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const flowFaqObras = addKeyword(["obras"]).addAnswer([
  "2.2 *Preguntas sobre Obras*:",
  "🧱 Escribe *edificación* para Permiso de edificación.",
  "💧⚡ Escribe *servicios* para Servicios básicos.",
  "🔢 Escribe *certificado* para Certificado de número.",
  "🧾 Escribe *cip* para Certificado de Informaciones Previas (CIP).",
  "✅ Escribe *recepción* para Recepción final de obras.",
  "🚧 Escribe *cierre* para Cierre perimetral.",
  "📐 Escribe *planos* para Planos de propiedad.",
  "🏞️ Escribe *aptitud* para Aptitud de terreno.",
  "📏 Escribe *subdivisión* para Subdivisión de terreno.",
  "🔨 Escribe *demolición* para Demolición.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasEdificacion = addKeyword([
  "edificación",
  "edificacion",
]).addAnswer([
  "🧱 *Permiso de edificación*:",
  "¿Cómo puedo construir o remodelar?",
  "Solicitar certificados, completar formulario, presentar documentación y esperar aprobación.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasServicios = addKeyword([
  "servicios",
  "servicios básicos",
]).addAnswer([
  "💧⚡ *Servicios básicos*:",
  "¿Cómo instalo agua, alcantarillado o electricidad?",
  "Consulta disponibilidad, presenta documentos en DOM o empresas proveedoras, y paga tarifas.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasCertificado = addKeyword([
  "certificado",
  "certificado de número",
  "numero",
]).addAnswer([
  "🔢 *Certificado de número*:",
  "¿Cómo obtener el certificado de número?",
  "Requiere escritura, plano de ubicación y pago de derechos.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasCIP = addKeyword(["cip"]).addAnswer([
  "🧾 *Certificado de Informaciones Previas (CIP)*:",
  "¿Cómo obtener un CIP?",
  "Formulario, escritura o dominio vigente, plano y pago de derechos.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasRecepcion = addKeyword(["recepción", "recepcion"]).addAnswer([
  "✅ *Recepción final de obras*:",
  "¿Cómo solicitar la recepción final?",
  "Formulario, certificado del arquitecto, planos y pago de derechos.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasCierre = addKeyword(["cierre", "perimetral"]).addAnswer([
  "🚧 *Cierre perimetral*:",
  "¿Cómo cercar mi terreno?",
  "Consultar en DOM, presentar croquis y respetar normas urbanas.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasPlanos = addKeyword(["planos"]).addAnswer([
  "📐 *Planos de propiedad*:",
  "¿Dónde obtenerlos?",
  "Presentar dirección y prueba de propiedad en la DOM.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasAptitud = addKeyword(["aptitud"]).addAnswer([
  "🏞️ *Aptitud de terreno*:",
  "¿Cómo saber si puedo construir?",
  "Solicitar CIP, zonificación y factibilidad de servicios.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasSubdiv = addKeyword(["subdivisión", "subdivision"]).addAnswer([
  "📏 *Subdivisión de terreno*:",
  "¿Qué hacer para subdividir?",
  "Presentar plano, CIP y documentos de propiedad. DOM revisa y aprueba.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

const faqObrasDemolicion = addKeyword(["demolición", "demolicion"]).addAnswer([
  "🔨 *Demolición*:",
  "¿Cómo obtener un permiso de demolición?",
  "Formulario, plano, documentos de propiedad, no expropiación y pago de derechos.",
  "✳️ Escribe *volver* o *menu* para regresar al menú principal.",
]);

// ⚠️ Se declara después para evitar ReferenceError
let flowPrincipal;

flowPrincipal = addKeyword(["hola", "ole", "alo"])
  .addAnswer("🙌 Hola Vecino")
  .addAnswer(
    [
      "📋 *Menú de ayuda:*",
      "1️⃣ *pago* permiso de circulación",
      "2️⃣ *cesfam* confirmación de horas CESFAM",
      "3️⃣ *faq* preguntas frecuentes",
      "4️⃣ *escríbenos* contacta con un funcionario",
    ],
    null,
    null,
    [flowPago, flowGracias, flowCesfam, flowDiscord, flowFaq, flowEscribenos]
  );

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([
    flowPrincipal,
    flowPago,
    flowCesfam,
    flowGracias,
    flowDiscord,
    flowFaq,
    flowFaqRentas,
    flowFaqObras,
    faqRentasAmbulante,
    faqRentasProvisional,
    faqRentasDescuento,
    faqRentasPatente,
    faqRentasPublicidad,
    faqRentasDeuda,
    faqRentasActualizacion,
    faqRentasVenta,
    faqObrasEdificacion,
    faqObrasServicios,
    faqObrasCertificado,
    faqObrasCIP,
    faqObrasRecepcion,
    faqObrasCierre,
    faqObrasPlanos,
    faqObrasAptitud,
    faqObrasSubdiv,
    faqObrasDemolicion,
    flowSecundario,
    flowVolver,
    flowEscribenos,
  ]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
