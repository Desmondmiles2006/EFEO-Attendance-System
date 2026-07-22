import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  employeeId: z.string().trim().max(60).optional().or(z.literal("")),
});

// Empty string / undefined both normalize to null (no project tag).
const optionalProjectId = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Select a leave type"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(3, "Please provide a reason").max(1000),
    projectId: optionalProjectId,
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  });

export const adminAssignLeaveSchema = z
  .object({
    userId: z.string().min(1, "Select a member"),
    leaveTypeId: z.string().min(1, "Select a leave type"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(3, "Please provide a reason").max(1000),
    projectId: optionalProjectId,
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  });

export const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reviewNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name is too short").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const projectMemberSchema = z.object({
  userId: z.string().min(1, "Select a member"),
});
