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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const client_s3_1 = require("@aws-sdk/client-s3");
let ElevenLabsService = class ElevenLabsService {
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY || '',
                secretAccessKey: process.env.AWS_SECRET_KEY || '',
            },
        });
    }
    async generateVoice(script, voiceId, userId, jobId) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            throw new common_1.HttpException('ELEVENLABS_API_KEY not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        // Split script into chunks of max 5000 characters (ElevenLabs limit is usually higher than Google, but let's be safe)
        const chunks = this.splitScript(script, 4500);
        const audioBuffers = [];
        for (const chunk of chunks) {
            if (!chunk.trim())
                continue;
            try {
                const response = await axios_1.default.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    text: chunk,
                    model_id: 'eleven_turbo_v2_5', // Faster model
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                }, {
                    headers: {
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer'
                });
                audioBuffers.push(Buffer.from(response.data));
            }
            catch (error) {
                const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
                throw new Error(`ElevenLabs Voice generation failed: ${errorMessage}`);
            }
        }
        const combinedBuffer = Buffer.concat(audioBuffers);
        // Upload combined MP3 to S3
        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            throw new Error('S3_BUCKET_NAME not configured');
        }
        const key = `audio/${userId}/${jobId}.mp3`;
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: combinedBuffer,
            ContentType: 'audio/mpeg',
        }));
        return `https://${bucketName}.s3.amazonaws.com/${key}`;
    }
    splitScript(script, maxLength) {
        const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
        const chunks = [];
        let currentChunk = '';
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxLength) {
                if (currentChunk)
                    chunks.push(currentChunk.trim());
                currentChunk = sentence;
            }
            else {
                currentChunk += ' ' + sentence;
            }
        }
        if (currentChunk)
            chunks.push(currentChunk.trim());
        return chunks;
    }
};
exports.ElevenLabsService = ElevenLabsService;
exports.ElevenLabsService = ElevenLabsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ElevenLabsService);
//# sourceMappingURL=elevenlabs.service.js.map