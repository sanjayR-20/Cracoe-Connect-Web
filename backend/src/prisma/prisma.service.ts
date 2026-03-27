import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      // eslint-disable-next-line no-console
      console.warn('DATABASE_URL not configured. Prisma features will be unavailable.');
      return;
    }
    try {
      await this.$connect();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn(`Failed to connect Prisma database. Continuing without DB features. ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
