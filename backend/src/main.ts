import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.enableCors(); // Enable CORS for frontend requests
  
  if (!process.env.VERCEL) {
    await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  } else {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }
}

// Ejecución normal para entorno local
if (!process.env.VERCEL) {
  bootstrap();
}

let cachedServer: any;

// Handler para Vercel Serverless Functions
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}
