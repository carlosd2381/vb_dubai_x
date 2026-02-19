import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendContactLeadNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      destination?: string;
      travelDate?: string;
      travelersInfo?: string;
      serviceTypes?: string[];
      preferences?: string;
      additionalComments?: string;
    };

    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        destination: body.destination || null,
        travelDate: body.travelDate ? new Date(body.travelDate) : null,
        travelersInfo: body.travelersInfo || null,
        serviceTypes: body.serviceTypes?.length ? body.serviceTypes.join(", ") : null,
        preferences: body.preferences || null,
        additionalComments: body.additionalComments || null,
        desiredServices: body.serviceTypes?.length ? body.serviceTypes.join(", ") : null,
        message: body.additionalComments || null,
        travelStart: body.travelDate ? new Date(body.travelDate) : null,
        travelEnd: null,
        source: "website",
      },
    });

    await db.communicationLog.create({
      data: {
        clientId: client.id,
        channel: "website",
        note: body.additionalComments || "Solicitud recibida desde formulario web",
      },
    });

    try {
      await sendContactLeadNotification({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        destination: body.destination,
        travelDate: body.travelDate,
        travelersInfo: body.travelersInfo,
        serviceTypes: body.serviceTypes,
        preferences: body.preferences,
        additionalComments: body.additionalComments,
      });
    } catch (error) {
      console.error("contact email notification failed", error);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el contacto" }, { status: 500 });
  }
}
