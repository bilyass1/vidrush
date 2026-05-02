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
exports.VeoService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const client_s3_1 = require("@aws-sdk/client-s3");
const gemini_service_1 = require("./gemini.service");
let VeoService = class VeoService {
    constructor(geminiService) {
        this.geminiService = geminiService;
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY || '',
                secretAccessKey: process.env.AWS_SECRET_KEY || '',
            },
        });
    }
    async generateClip(prompt, style, userId, jobId, index) {
        const apiKey = process.env.VEO_API_KEY;
        if (!apiKey) {
            throw new common_1.HttpException('VEO_API_KEY missing', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`;
        try {
            const response = await axios_1.default.post(url, {
                instances: [{
                        prompt: `${style} style cinematic footage: ${prompt}\n4K quality, smooth camera movement,\nprofessional lighting, no text, no people`
                    }],
                parameters: {
                    aspectRatio: "16:9",
                    durationSeconds: 8,
                    sampleCount: 1
                }
            }, {
                headers: {
                    'x-goog-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            const operationName = response.data.name;
            const finalUri = await this.pollOperation(operationName, apiKey);
            const videoBuffer = await this.downloadVideo(finalUri);
            const bucketName = process.env.S3_BUCKET_NAME;
            if (!bucketName) {
                throw new Error('S3_BUCKET_NAME not configured');
            }
            const key = `video/${userId}/${jobId}/clip_${index}.mp4`;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: videoBuffer,
                ContentType: 'video/mp4',
            }));
            return `https://${bucketName}.s3.amazonaws.com/${key}`;
        }
        catch (error) {
            throw new Error(`Video clip generation failed: ${error.message || error}`);
        }
    }
    async pollOperation(operationName, apiKey) {
        const maxRetries = 30;
        const pollInterval = 10000;
        for (let i = 0; i < maxRetries; i++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            try {
                const res = await axios_1.default.get(`https://generativelanguage.googleapis.com/v1beta/${operationName}`, {
                    headers: { 'x-goog-api-key': apiKey }
                });
                if (res.data.done) {
                    if (res.data.error) {
                        throw new Error(res.data.error.message);
                    }
                    let output = res.data.response;
                    if (output && output.predictions && output.predictions[0]) {
                        // Sometimes it could be predictions[0].gcsUri, or perhaps result.gcsUri, assuming it has something. 
                        // Because Veo API shape varies slightly in GCP compared to Vertex, we just handle a generic string.
                        const result = output.predictions[0].bytesBase64 || output.predictions[0].gcsUri || output.predictions[0].content;
                        return result;
                    }
                    if (output?.result?.gcsUri) {
                        return output.result.gcsUri;
                    }
                    throw new Error("No output found in response data");
                }
            }
            catch (err) {
                console.error(err);
                throw new Error(`Failed to poll operation: ${err.message || err}`);
            }
        }
        throw new Error('Timeout waiting for video clip generation');
    }
    async downloadVideo(uri) {
        if (uri.startsWith('http')) {
            const res = await axios_1.default.get(uri, { responseType: 'arraybuffer' });
            return Buffer.from(res.data);
        }
        // If AI Studio returned a direct content blob or gs uri
        if (uri.startsWith('gs://')) {
            // Generally AI Studio returns https URIs rather than gs:// 
            // If a gs uri appears, the API Key won't naturally extract it without Cloud Storage API
            // We will fallback to a simple fetch if it's somehow accessible or error.
            throw new Error('Received gs:// URI from AI Studio, which requires Vertex/Storage auth to fetch natively.');
        }
        return Buffer.from(uri, 'base64');
    }
    async generateClipsForScript(script, duration, style, userId, jobId) {
        const words = script.split(/\s+/);
        const segments = [];
        const wordsPerSegment = Math.ceil(words.length / duration);
        for (let i = 0; i < words.length; i += wordsPerSegment) {
            segments.push(words.slice(i, i + wordsPerSegment).join(' '));
        }
        const clipUrls = [];
        for (let i = 0; i < segments.length; i++) {
            const visualPrompt = await this.geminiService.generateVisualPrompt(segments[i]);
            const clipUrl = await this.generateClip(visualPrompt, style, userId, jobId, i);
            clipUrls.push(clipUrl);
        }
        return clipUrls;
    }
};
exports.VeoService = VeoService;
exports.VeoService = VeoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService])
], VeoService);
//# sourceMappingURL=veo.service.js.map