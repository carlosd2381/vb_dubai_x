type ContactLeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  destination?: string;
  travelDate?: string;
  travelersInfo?: string;
  serviceTypes?: string[];
  preferences?: string;
  additionalComments?: string;
};

function line(label: string, value?: string) {
  return `${label}: ${value?.trim() ? value.trim() : "-"}`;
}

export async function sendContactLeadNotification(payload: ContactLeadPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_TO;
  const from = process.env.CONTACT_NOTIFY_FROM || "onboarding@resend.dev";

  if (!resendApiKey || !to) {
    return { sent: false, reason: "missing-config" as const };
  }

  const fullName = `${payload.firstName} ${payload.lastName}`.trim();
  const serviceTypes = payload.serviceTypes?.length ? payload.serviceTypes.join(", ") : "-";
  const text = [
    "Nuevo lead desde el formulario web",
    "",
    line("Nombre", fullName),
    line("Email", payload.email),
    line("Teléfono", payload.phone),
    line("Destino", payload.destination),
    line("Fecha de viaje", payload.travelDate),
    line("Viajeros", payload.travelersInfo),
    line("Servicios", serviceTypes),
    line("Preferencias", payload.preferences),
    line("Comentarios", payload.additionalComments),
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Nuevo lead web: ${fullName || payload.email}`,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend failed: ${response.status} ${details}`);
  }

  return { sent: true };
}
