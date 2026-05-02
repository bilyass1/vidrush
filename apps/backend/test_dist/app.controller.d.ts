import { Request } from "express";
import { AppService } from "./app.service";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): {
        status: string;
    };
    getProfile(req: Request): Express.User | undefined;
}
//# sourceMappingURL=app.controller.d.ts.map