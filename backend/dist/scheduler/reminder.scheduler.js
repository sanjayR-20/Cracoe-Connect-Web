"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReminderScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");
let ReminderScheduler = ReminderScheduler_1 = class ReminderScheduler {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReminderScheduler_1.name);
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        }
    }
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
    async sendEmail(to, title, deadline) {
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
    async sendPush(userId, title, deadline) {
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
};
exports.ReminderScheduler = ReminderScheduler;
__decorate([
    (0, schedule_1.Cron)('0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderScheduler.prototype, "handleHourly", null);
exports.ReminderScheduler = ReminderScheduler = ReminderScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReminderScheduler);
//# sourceMappingURL=reminder.scheduler.js.map