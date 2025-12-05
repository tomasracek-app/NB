import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createClientSchema } from "@/lib/validators/client";

// GET /api/admin/clients - Seznam všech klientů
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prisma není k dispozici během vývoje bez databáze
    if (!prisma) {
      return NextResponse.json({
        clients: [],
        message: "Databáze není k dispozici. Spusťte: npx prisma generate",
      });
    }

    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      include: {
        settings: true,
        _count: {
          select: {
            users: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Chyba při načítání klientů" },
      { status: 500 }
    );
  }
}

// POST /api/admin/clients - Vytvoření nového klienta
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Databáze není k dispozici" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validatedData = createClientSchema.parse(body);

    // Kontrola unikátnosti slugu
    const existingClient = await prisma.client.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Klient s tímto slugem již existuje" },
        { status: 400 }
      );
    }

    // Vytvoření klienta s výchozím nastavením
    const client = await prisma.client.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        settings: {
          create: {
            activeModules: [],
          },
        },
      },
      include: {
        settings: true,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Neplatná data", details: error },
        { status: 400 }
      );
    }

    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Chyba při vytváření klienta" },
      { status: 500 }
    );
  }
}
