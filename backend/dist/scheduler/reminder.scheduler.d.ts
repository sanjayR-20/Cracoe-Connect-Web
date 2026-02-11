import { PrismaService } from '../prisma/prisma.service';
export declare class ReminderScheduler {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleHourly(): Promise<void>;
    private sendEmail;
    private sendPush;
}
