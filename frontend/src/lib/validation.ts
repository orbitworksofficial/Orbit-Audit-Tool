import { z } from 'zod';

/** Accepts "example.com" as well as a full URL; Python prepends https:// itself. */
const urlish = z
  .string()
  .trim()
  .min(3, 'Enter your website')
  .refine(
    (v) => /^([a-z]+:\/\/)?[\w-]+(\.[\w-]+)+/i.test(v),
    'That does not look like a valid website'
  );

export const scanSchema = z.object({
  url: urlish,
  business_name: z.string().trim().min(1, 'Enter your business name'),
  full_name: z.string().trim().min(1, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email'),
  city: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default('auto-detect'),
  whatsapp: z.string().trim().optional().default(''),
});

export type ScanInput = z.infer<typeof scanSchema>;

export const signUpSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().trim().min(1, 'Enter your name'),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
