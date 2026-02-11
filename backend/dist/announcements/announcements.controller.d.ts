import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    create(req: any, dto: CreateAnnouncementDto): Promise<{
        id: string;
        title: string;
        message: string;
        createdBy: string;
        createdAt: Date;
    }>;
    getAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        title: string;
        message: string;
        createdBy: string;
        createdAt: Date;
    }[]>;
}
