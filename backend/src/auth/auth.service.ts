import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sign } from 'jsonwebtoken';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\n/g, '\n');
      if (!projectId || !clientEmail || !privateKey) {
        // eslint-disable-next-line no-console
        console.warn('Firebase credentials not configured. Auth endpoints will be unavailable.');
        return;
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  }

  async verifyAndIssue(idToken: string) {
    if (!admin.apps.length) {
      throw new UnauthorizedException('Firebase auth is not configured');
    }
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = decoded.email || '';
      const allowedDomain = process.env.ALLOWED_DOMAIN || 'cracoe.com';
      if (!email.endsWith(`@${allowedDomain}`)) {
        throw new ForbiddenException('Unauthorized domain');
      }

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new ForbiddenException('User not provisioned');
      }

      const token = sign(
        { sub: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '12h' },
      );

      return { token, user };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
