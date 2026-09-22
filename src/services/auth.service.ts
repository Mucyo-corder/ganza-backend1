/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Authentication & Identity Service
 */

import jwt from 'jsonwebtoken';
import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { User, UserRole, Membership } from '../types/index.ts';
import { BusinessService } from './business.service.ts';
import { ENV } from '../config/environment.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

const userRepo = new FirestoreRepository<User>('users');
const membershipRepo = new FirestoreRepository<Membership>('memberships');

export class AuthService {
  static generateToken(user: { id: string; email: string; role: UserRole; businessId?: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static async register(data: {
    email: string;
    password?: string;
    name: string;
    phone?: string;
    role?: UserRole;
    businessName?: string;
  }): Promise<{ user: User; token: string; businessId?: string }> {
    // Check if user exists
    const existing = await userRepo.query([{ field: 'email', op: '==', value: data.email }]);
    if (existing.length > 0) {
      throw new Error('Iyi emeli isanzwe ikoreshwa muri system.');
    }

    const assignedRole = data.role || 'owner';

    const user = await userRepo.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: assignedRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let businessId: string | undefined;

    // If businessName is provided, create the initial business
    if (data.businessName) {
      const { business } = await BusinessService.createBusiness(user.id, {
        name: data.businessName,
        phone: data.phone || '0780000000',
        email: data.email,
        address: {
          district: 'Kigali',
          description: 'Aho bakorera',
        },
      });
      businessId = business.id;
      await userRepo.update(user.id, businessId, { businessId });
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      businessId,
    });

    return { user: { ...user, businessId }, token, businessId };
  }

  static async login(data: {
    email: string;
    password?: string;
  }): Promise<{ user: User; token: string; businessId?: string }> {
    const users = await userRepo.query([{ field: 'email', op: '==', value: data.email }]);
    if (users.length === 0) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED.rw);
    }
    const user = users[0];

    // Find user's active membership
    let businessId = user.businessId;
    if (!businessId) {
      const memberships = await membershipRepo.query([
        { field: 'userId', op: '==', value: user.id },
        { field: 'status', op: '==', value: 'active' },
      ]);
      if (memberships.length > 0) {
        businessId = memberships[0].businessId;
      }
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      businessId,
    });

    return { user: { ...user, businessId }, token, businessId };
  }

  static async getMe(userId: string): Promise<User | null> {
    return userRepo.findById(userId);
  }
}
