import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Získá aktuální session nebo přesměruje na login
 */
export async function getRequiredSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Získá aktuální session (může být null)
 */
export async function getOptionalSession() {
  return auth();
}

/**
 * Ověří, že uživatel je admin
 */
export async function requireAdmin() {
  const session = await getRequiredSession();

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

/**
 * Ověří, že uživatel má přiřazeného klienta (pro CLIENT roli)
 */
export async function requireClient() {
  const session = await getRequiredSession();

  if (session.user.role === "ADMIN") {
    // Admin může přistupovat ke všemu
    return session;
  }

  if (!session.user.clientId) {
    throw new Error("Uživatel nemá přiřazeného klienta");
  }

  return session;
}

/**
 * Získá clientId pro databázové dotazy
 * KRITICKÉ: Vždy použít v každém dotazu pro izolaci dat klientů
 */
export async function getClientId(): Promise<string> {
  const session = await requireClient();

  // Pro admin můžeme později přidat možnost přepínat mezi klienty
  if (!session.user.clientId) {
    throw new Error("clientId není k dispozici");
  }

  return session.user.clientId;
}
