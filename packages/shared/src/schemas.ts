import { z } from 'zod';
import { UserRole, TicketStatus, TicketPriority, ObjectionStatus } from './enums';

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'نام کاربری یا ایمیل الزامی است'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ نویسه باشد'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const CreateTicketSchema = z.object({
  serviceId: z.string().uuid('شناسه خدمت معتبر نیست'),
  subject: z.string().min(3, 'عنوان تیکت باید حداقل ۳ نویسه باشد').max(150, 'عنوان تیکت نمی‌تواند بیشتر از ۱۵۰ نویسه باشد'),
  description: z.string().min(10, 'توضیحات تیکت باید حداقل ۱۰ نویسه باشد'),
  priority: z.nativeEnum(TicketPriority).optional(),
});

export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  note: z.string().optional(),
});

export type UpdateTicketStatusDto = z.infer<typeof UpdateTicketStatusSchema>;

export const AssignTicketSchema = z.object({
  departmentId: z.string().uuid('شناسه واحد معتبر نیست').optional(),
  assignedToId: z.string().uuid('شناسه کارشناس معتبر نیست').nullable(),
  note: z.string().optional(),
});

export type AssignTicketDto = z.infer<typeof AssignTicketSchema>;

export const CreateMessageSchema = z.object({
  content: z.string().min(1, 'متن پیام نمی‌تواند خالی باشد'),
  isInternal: z.boolean().default(false),
});

export type CreateMessageDto = z.infer<typeof CreateMessageSchema>;

export const CreateFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type CreateFeedbackDto = z.infer<typeof CreateFeedbackSchema>;

export const CreateObjectionSchema = z.object({
  description: z.string().min(10, 'توضیحات اعتراض باید حداقل ۱۰ نویسه باشد').max(1000),
});

export type CreateObjectionDto = z.infer<typeof CreateObjectionSchema>;

export const ReviewObjectionSchema = z.object({
  status: z.nativeEnum(ObjectionStatus),
  resolutionNote: z.string().min(5, 'یادداشت پاسخ اعتراض الزامی است'),
});

export type ReviewObjectionDto = z.infer<typeof ReviewObjectionSchema>;

export const CreateUserSchema = z.object({
  fullName: z.string().min(2, 'نام کامل الزامی است'),
  email: z.string().email('ایمیل وارد شده معتبر نیست'),
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ نویسه باشد'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ نویسه باشد'),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().uuid().optional().nullable(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'نام واحد الزامی است'),
  code: z.string().min(2, 'کد واحد الزامی است').max(20),
  description: z.string().optional(),
  managerId: z.string().uuid().optional().nullable(),
});

export type CreateDepartmentDto = z.infer<typeof CreateDepartmentSchema>;

export const CreateServiceCategorySchema = z.object({
  name: z.string().min(2, 'نام دسته‌بندی الزامی است'),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export type CreateServiceCategoryDto = z.infer<typeof CreateServiceCategorySchema>;

export const CreateServiceSchema = z.object({
  name: z.string().min(2, 'نام خدمت الزامی است'),
  description: z.string().optional(),
  categoryId: z.string().uuid('شناسه دسته بندی نامعتبر است'),
  departmentId: z.string().uuid('شناسه واحد نامعتبر است'),
  defaultPriority: z.nativeEnum(TicketPriority).default(TicketPriority.NORMAL),
  targetResolutionHours: z.number().int().min(1).default(48),
});

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;

