
import { query } from '../services/database';
import * as bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password?: string;
  created_at?: Date;
}

export class UserModel {
  // Create a new user
  static async create(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users(email, password) VALUES($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  // Find user by id
  static async findById(id: string): Promise<User | null> {
    const result = await query('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Verify password
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }
}
