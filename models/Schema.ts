
import * as z from 'zod';

// User schema for registration
export const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile schema
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.string().optional().transform(val => val ? parseInt(val) : null),
  occupation: z.string().optional(),
  bio: z.string().optional(),
  industry_categories: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([])
});

// Availability schema
export const availabilitySchema = z.object({
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  is_available: z.boolean().default(true)
});
