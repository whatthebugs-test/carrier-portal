import { z } from "zod";

const serverEnvSchema = z.object({
  SHIPMENT_API_URL: z.string().url(),
  SHIPMENT_API_TOKEN: z.string().min(1, "SHIPMENT_API_TOKEN is required"),
  SHIPMENT_API_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Parsed lazily: `next build` imports route modules while collecting page data,
 * and CI builds without runtime secrets.
 */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new Error(`Invalid server environment:\n  ${problems.join("\n  ")}`);
    }
    cached = parsed.data;
  }
  return cached;
}
