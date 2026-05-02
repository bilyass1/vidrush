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
exports.GenerateVideoDto = exports.VIDEO_MARKETS = exports.VIDEO_ASPECT_RATIOS = exports.VIDEO_GENRES = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
exports.VIDEO_GENRES = [
    'Documentary', 'Dark History', 'True Crime', 'Educational',
    'Funny', 'History', 'Horror', 'Science', 'News', 'Motivation',
];
exports.VIDEO_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5'];
exports.VIDEO_MARKETS = ['en-us', 'en-uk', 'fr', 'ar'];
class GenerateVideoDto {
}
exports.GenerateVideoDto = GenerateVideoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], GenerateVideoDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.VIDEO_GENRES),
    __metadata("design:type", String)
], GenerateVideoDto.prototype, "genre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.VIDEO_ASPECT_RATIOS),
    __metadata("design:type", String)
], GenerateVideoDto.prototype, "aspectRatio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.VIDEO_MARKETS),
    __metadata("design:type", String)
], GenerateVideoDto.prototype, "market", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(8),
    (0, class_validator_1.Max)(1600),
    __metadata("design:type", Number)
], GenerateVideoDto.prototype, "duration", void 0);
//# sourceMappingURL=generate-video.dto.js.map