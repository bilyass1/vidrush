import { User, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}
//# sourceMappingURL=users.service.d.ts.map