"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrokService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let GrokService = class GrokService {
    async generateScript(topic, duration, style) {
        const apiKey = process.env.GROK_API_KEY;
        if (!apiKey) {
            throw new common_1.HttpException('GROK_API_KEY not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const response = await axios_1.default.post('https://api.x.ai/v1/chat/completions', {
                model: 'grok-4-fast',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional documentary scriptwriter.\nWrite continuous voiceover narration only.\nNo headers, no sections, no [MUSIC] tags.\nNo stage directions. Just the spoken words.'
                    },
                    {
                        role: 'user',
                        content: `Write a ${duration}-minute documentary script about: ${topic}\nStyle: ${style}\nWrite approximately ${duration * 130} words.\nStart immediately with the narration.`
                    }
                ],
                max_tokens: duration * 200,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            throw new Error(`Script generation failed: ${error.message || error}`);
        }
    }
    async generateVisualPrompt(segment) {
        const apiKey = process.env.GROK_API_KEY;
        if (!apiKey) {
            throw new common_1.HttpException('GROK_API_KEY not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const response = await axios_1.default.post('https://api.x.ai/v1/chat/completions', {
                model: 'grok-4-fast',
                messages: [
                    {
                        role: 'system',
                        content: 'You write concise visual prompts without any quotes or extra formatting.'
                    },
                    {
                        role: 'user',
                        content: `Generate a 10-word visual scene description for: ${segment}`
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            throw new Error(`Visual prompt generation failed: ${error.message || error}`);
        }
    }
};
exports.GrokService = GrokService;
exports.GrokService = GrokService = __decorate([
    (0, common_1.Injectable)()
], GrokService);
//# sourceMappingURL=grok.service.js.map