import { z } from 'zod';
import { REPORT_TYPES } from './types';

export const reportTypeSchema = z.enum(REPORT_TYPES);

export const createReportSchema = z
  .object({
    type: reportTypeSchema,
    lineId: z.number().int({ message: 'Selecione a linha' }),
    stationId: z.number().int().nullable().optional(),
    directionId: z.number().int().nullable().optional(),
    description: z.string().max(500, 'A descrição deve ter no máximo 500 caracteres').nullable().optional(),
    locationLat: z.number().nullable().optional(),
    locationLng: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const isTrainEvent = [
      'TRAIN_ARRIVING',
      'TRAIN_ARRIVED',
      'TRAIN_DEPARTED',
      'TRAIN_STOPPED',
    ].includes(data.type);

    if (isTrainEvent) {
      if (!data.stationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stationId'],
          message: 'A estação é obrigatória para relatos de trem',
        });
      }
      if (!data.directionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['directionId'],
          message: 'O sentido é obrigatório para relatos de trem',
        });
      }
    }
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const loginSchema = z.object({
  email: z.string().email('Insira um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Insira um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  username: z.string().min(2, 'Nome de usuário muito curto').max(30).optional().or(z.literal('')),
  name: z.string().max(100).optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const hideReportSchema = z.object({
  reason: z.string().min(3, 'Informe o motivo para ocultar').max(500),
});

export type HideReportInput = z.infer<typeof hideReportSchema>;

const latLngSchema = z
  .string()
  .refine((v) => v.trim() !== '' && !Number.isNaN(Number(v)), 'Coordenada inválida')
  .transform((v) => Number(v));

const createStationSchema = z.object({
  name: z.string().min(2, 'Informe o nome da estação').max(100),
  code: z.string().max(10).optional().or(z.literal('')),
  latitude: latLngSchema.refine((n) => n >= -90 && n <= 90, 'Latitude fora do intervalo'),
  longitude: latLngSchema.refine((n) => n >= -180 && n <= 180, 'Longitude fora do intervalo'),
});

const createBranchSchema = z.object({
  name: z.string().min(2, 'Informe o nome do ramal').max(100),
  code: z.string().min(2, 'Código muito curto').max(30),
  stations: z
    .array(createStationSchema)
    .min(2, 'Adicione pelo menos 2 estações')
    .max(200),
});

export const createLineSchema = z.object({
  name: z.string().min(3, 'Informe o nome da linha').max(100),
  code: z.string().min(2, 'Código muito curto').max(30),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  branches: z
    .array(createBranchSchema)
    .min(1, 'Adicione pelo menos 1 ramal')
    .max(8),
});

export type CreateLineInput = z.infer<typeof createLineSchema>;
