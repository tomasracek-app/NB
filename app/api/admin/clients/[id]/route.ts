import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateClientSchema } from "@/lib/validators/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/clients/[id] - Detail klienta
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Databáze není k dispozici" },
        { status: 503 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id, deletedAt: null },
      include: {
        settings: true,
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            revenueData: true,
            products: true,
            leads: true,
            teleCustomers: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Klient nenalezen" },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Chyba při načítání klienta" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/clients/[id] - Aktualizace klienta
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

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
    const validatedData = updateClientSchema.parse(body);

    // Kontrola existence klienta
    const existingClient = await prisma.client.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Klient nenalezen" },
        { status: 404 }
      );
    }

    // Kontrola unikátnosti slugu (pokud se mění)
    if (validatedData.slug && validatedData.slug !== existingClient.slug) {
      const slugExists = await prisma.client.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Klient s tímto slugem již existuje" },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: validatedData,
      include: {
        settings: true,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Neplatná data", details: error },
        { status: 400 }
      );
    }

    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Chyba při aktualizaci klienta" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/clients/[id] - Soft delete klienta
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Databáze není k dispozici" },
        { status: 503 }
      );
    }

    // Kontrola existence klienta
    const existingClient = await prisma.client.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Klient nenalezen" },
        { status: 404 }
      );
    }

    // Soft delete - nastavení deletedAt
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Chyba při mazání klienta" },
      { status: 500 }
    );
  }
}
