// Prisma Client singleton
// POZNÁMKA: Před použitím spustit `npx prisma generate`

let prisma: any;

try {
  // Dynamický import pro případ, že Prisma client není vygenerován
  const { PrismaClient } = require("@prisma/client");

  const globalForPrisma = globalThis as unknown as {
    prisma: typeof PrismaClient | undefined;
  };

  prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} catch {
  // Prisma client není vygenerován - stub pro build
  console.warn(
    "⚠️ Prisma client není vygenerován. Spusťte: npx prisma generate"
  );
  prisma = null;
}

export { prisma };
export default prisma;
