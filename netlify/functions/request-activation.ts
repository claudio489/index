// netlify/functions/request-activation.ts
// Recibe una solicitud (acceso tecnico o dispositivo adicional), la guarda en
// Supabase (usando el token de sesion real del usuario, para pasar RLS)
// y envia un mail de aviso a Claudio via Resend.

import type { Handler } from "@netlify/functions";

const SUPABASE_URL = "https://crifnfmvaihnapuxahdc.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const NOTIFY_EMAIL = "claudio@deepspot.cl";
const FROM_EMAIL = "notificaciones@mail.deepspot.cl";

const SUBJECTS: Record<string, string> = {
  tech_access: "Nueva solicitud de activacion - Modulo tecnico",
  extra_device: "Solicitud de dispositivo adicional - Modulo tecnico",
};

const LABELS: Record<string, string> = {
  tech_access: "activacion del modulo tecnico (Planificador Deco)",
  extra_device: "un dispositivo adicional para el modulo tecnico",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, email, fullName, accessToken, type } = body;
    const requestType = type === "extra_device" ? "extra_device" : "tech_access";

    if (!userId || !email || !accessToken) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos (falta sesion activa)" }) };
    }

    // 1. Guardar la solicitud en Supabase, usando el token del usuario real
    // (no la anon key sola) para que la politica RLS "auth.uid() = user_id" se cumpla.
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/activation_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        email,
        full_name: fullName || null,
        status: "pending",
        type: requestType,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("Error guardando solicitud en Supabase:", errText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No se pudo guardar la solicitud", detail: errText }),
      };
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
            subject: SUBJECTS[requestType],
            html: `
              <p>Se recibio una nueva solicitud de ${LABELS[requestType]}:</p>
              <ul>
                <li><strong>Nombre:</strong> ${fullName || "(no informado)"}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>User ID:</strong> ${userId}</li>
              </ul>
              ${requestType === "tech_access"
                ? "<p>Revisa sus certificaciones (Nitrox, Gas Blender, Tec 40) y, si corresponde, activa el acceso desde Supabase.</p>"
                : "<p>Si corresponde, aumenta su tech_device_limit desde Supabase.</p>"}
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
