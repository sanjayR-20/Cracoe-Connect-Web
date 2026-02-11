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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jsonwebtoken_1 = require("jsonwebtoken");
const admin = require("firebase-admin");
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        if (!admin.apps.length) {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\n/g, '\n');
            if (!projectId || !clientEmail || !privateKey) {
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
    async verifyAndIssue(idToken) {
        if (!admin.apps.length) {
            throw new common_1.UnauthorizedException('Firebase auth is not configured');
        }
        try {
            const decoded = await admin.auth().verifyIdToken(idToken);
            const email = decoded.email || '';
            const allowedDomain = process.env.ALLOWED_DOMAIN || 'cracoe.com';
            if (!email.endsWith(`@${allowedDomain}`)) {
                throw new common_1.ForbiddenException('Unauthorized domain');
            }
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new common_1.ForbiddenException('User not provisioned');
            }
            const token = (0, jsonwebtoken_1.sign)({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
            return { token, user };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map