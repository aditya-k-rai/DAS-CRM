"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: ['error', 'warn', 'log', 'debug'] });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3001);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api/v1');
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Business CRM API')
        .setDescription('Final Business CRM — Web + Android')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port);
    common_1.Logger.log(`🚀 CRM Backend running on http://localhost:${port}`, 'Bootstrap');
    common_1.Logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map