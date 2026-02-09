import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as sgMail from '@sendgrid/mail';
import * as admin from 'firebase-admin';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(private prisma: PrismaService) {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  @Cron('0 * * * *')
  async handleHourly() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        deadline: { lt: in24h, gt: now },
        status: { not: 'Completed' },
      },
      include: { assignedTo: true },
    });

    for (const task of tasks) {
      await this.prisma.task.update({ where: { id: task.id }, data: { isUrgent: true } });
      await this.sendEmail(task.assignedTo.email, task.title, task.deadline);
      await this.sendPush(task.assignedTo.id, task.title, task.deadline);
    }

    this.logger.log(`Reminder run completed: ${tasks.length} tasks flagged`);
  }

  private async sendEmail(to: string, title: string, deadline: Date) {
    const from = process.env.SENDGRID_FROM_EMAIL;
    if (!from || !process.env.SENDGRID_API_KEY) {
      return;
    }
    await sgMail.send({
      to,
      from,
      subject: `Urgent Task: ${title}`,
      text: `Your task is due by ${deadline.toISOString()}.`,
    });
  }

  private async sendPush(userId: string, title: string, deadline: Date) {
    if (!admin.apps.length) {
      return;
    }
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) {
      return;
    }
    const message = {
      notification: {
        title: `Urgent: ${title}`,
        body: `Due by ${deadline.toLocaleString()}`,
      },
      tokens: tokens.map((t) => t.token),
    };
    await admin.messaging().sendEachForMulticast(message);
  }
}
