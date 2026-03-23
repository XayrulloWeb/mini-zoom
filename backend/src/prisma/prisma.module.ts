
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его каждый раз
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Экспортируем сервис!
})
export class PrismaModule {}