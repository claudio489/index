// netlify/functions/request-activation.ts
// Recibe una solicitud de activacion de modulo tecnico, la guarda en Supabase
// y envia un mail de aviso a Claudio via Resend.

import type { Handler } from "@netlify/functions";

const SUPABASE_URL = "https://crifnfmvaihnapuxahdc.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const NOTIFY_EMAIL = "claudio@deepspot.cl";
const FROM_EMAIL = "notificaciones@mail.deepspot.cl";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, email, fullName } = body;

    if (!userId || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos" }) };
    }

    // 1. Guardar la solicitud en Supabase (respaldo aunque el mail falle)
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/activation_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        email,
        full_name: fullName || null,
        status: "pending",
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("Error guardando solicitud en Supabase:", errText);
    }

    // 2. Enviar mail de aviso via Resend (si falla, no rompe la solicitud ya guardada)
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `DeepSpot <${FROM_EMAIL}>`,
            to: [NOTIFY_EMAIL],
            subject: "Nueva solicitud de activacion - Modulo tecnico",
            html: `
              <p>Se recibio una nueva solicitud de activacion del modulo tecnico (Planificador Deco):</p>
              <ul>
                <li><strong>Nombre:</strong> ${fullName || "(no informado)"}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>User ID:</strong> ${userId}</li>
              </ul>
              <p>Revisa sus certificaciones (Nitrox, Gas Blender, Tec 40) y, si corresponde, activa el acceso desde Supabase.</p>
            `,
          }),
        });
      } catch (mailErr) {
        console.error("Error enviando mail via Resend:", mailErr);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err: any) {
    console.error("Error en request-activation:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Error interno" }),
    };
  }
};

