import { z } from 'zod';

export enum UserRole {
  ADMIN = 'ADMIN',
  CEO = 'CEO',
  ACCOUNTANT = 'ACCOUNTANT',
  EXPERT = 'EXPERT',
}

// Схемы для валидации с помощью Zod
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailConfigBaseSchema = z.object({
  smtp_host: z.string().min(1, "SMTP host обязателен"),
  smtp_port: z.number().int().positive(),
  smtp_user: z.string().min(1, "SMTP user обязателен"),
  imap_host: z.string().min(1, "IMAP host обязателен"),
  imap_port: z.number().int().positive(),
  imap_user: z.string().min(1, "IMAP user обязателен"),
});

export const EmailConfigCreateSchema = EmailConfigBaseSchema.extend({
  smtp_password: z.string().min(1, "SMTP password обязателен"),
  imap_password: z.string().min(1, "IMAP password обязателен"),
});

export const EmailConfigReadSchema = EmailConfigBaseSchema.extend({
  last_sync_at: z.string().datetime().nullable().optional(),
  sync_enabled: z.boolean(),
});

export const UserBaseSchema = z.object({
  email: z.string().regex(emailRegex, "Некорректный email"),
  full_name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(255),
  role: z.nativeEnum(UserRole),
  specialization: z.string().nullable().optional(),
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string().min(12, "Пароль должен быть не менее 12 символов"),
  email_config: EmailConfigCreateSchema.nullable().optional(),
  settings: z.record(z.any()).default({}),
});

export const UserReadSchema = UserBaseSchema.extend({
  id: z.string().uuid(),
  is_active: z.boolean(),
  can_authenticate: z.boolean(),
  company_id: z.string().uuid(),
  settings: z.record(z.any()),
});

export const UserUpdateSchema = z.object({
  full_name: z.string().min(2).max(255).optional().nullable(),
  specialization: z.string().optional().nullable(),
  can_authenticate: z.boolean().optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
});

export const UserLoginSchema = z.object({
  email: z.string().regex(emailRegex, "Некорректный email"),
  password: z.string().min(1),
});

export const StatusResponseSchema = z.object({
  status: z.literal("ok"),
  message: z.string().optional().nullable(),
});

export const LogoutResponseSchema = z.object({
  detail: z.literal("Successfully logged out"),
});

export const UserFilterParamsSchema = z.object({
  role: z.nativeEnum(UserRole).optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  can_authenticate: z.boolean().optional().nullable(),
  search: z.string().optional().describe("Поиск по имени или email"),

  sort_by: z.enum(["created_at", "full_name", "last_login", "email"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),

  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Типы для TypeScript
export type EmailConfigBase = z.infer<typeof EmailConfigBaseSchema>;
export type EmailConfigCreate = z.infer<typeof EmailConfigCreateSchema>;
export type EmailConfigRead = z.infer<typeof EmailConfigReadSchema>;

export type UserBase = z.infer<typeof UserBaseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserRead = z.infer<typeof UserReadSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserLoginSchema = z.infer<typeof UserLoginSchema>;
export type StatusResponse = z.infer<typeof StatusResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type UserFilterParams = z.infer<typeof UserFilterParamsSchema>;

// Константы разрешений ролей
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.CEO, UserRole.ACCOUNTANT, UserRole.EXPERT],
  [UserRole.CEO]: [UserRole.ACCOUNTANT, UserRole.EXPERT],
  [UserRole.ACCOUNTANT]: [UserRole.EXPERT],
  [UserRole.EXPERT]: [],
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS;