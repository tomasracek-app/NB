import { z } from "zod";

// Schema pro vytvoření klienta
export const createClientSchema = z.object({
  name: z
    .string()
    .min(2, "Název musí mít alespoň 2 znaky")
    .max(100, "Název může mít maximálně 100 znaků"),
  slug: z
    .string()
    .min(2, "Slug musí mít alespoň 2 znaky")
    .max(50, "Slug může mít maximálně 50 znaků")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug může obsahovat pouze malá písmena, čísla a pomlčky"
    ),
});

// Schema pro aktualizaci klienta
export const updateClientSchema = createClientSchema.partial();

// Schema pro nastavení klienta
export const clientSettingsSchema = z.object({
  timezone: z.string().default("Europe/Prague"),
  dateFormat: z.string().default("DD.MM.YYYY"),
  currency: z.string().default("CZK"),
  activeModules: z.array(z.enum(["REVENUE", "INVENTORY", "LEADS", "TELEPHONY"])).default([]),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyIco: z.string().optional(),
  companyDic: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIban: z.string().optional(),
  invoicePrefix: z.string().default("FV"),
  invoiceNextNum: z.number().int().positive().default(1),
});

// Typy odvozené ze schémat
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientSettingsInput = z.infer<typeof clientSettingsSchema>;
