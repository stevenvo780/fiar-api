import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    cors: true,
  });

  app.setGlobalPrefix('api/v1');

  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('FIAR API')
    .setDescription('Backend de FIAR para gestion de clientes, transacciones, autenticacion y pagos (Mercado Pago)')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app
    .getHttpAdapter()
    .getInstance()
    .get('/health', (req, res) => {
      res.status(200).send('OK');
    });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 8080);
  await app.listen(port, '0.0.0.0', () => {
    console.info(`Application is running on port ${port}`);
  });
}
bootstrap();
