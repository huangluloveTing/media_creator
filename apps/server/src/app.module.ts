import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from './modules/project/project.module';
import { ShotModule } from './modules/shot/shot.module';
import { SeedanceModule } from './modules/seedance/seedance.module';
import { FFmpegModule } from './modules/ffmpeg/ffmpeg.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'media_creator'),
        autoLoadEntities: true,
        synchronize: true, // dev only; use migrations in production
      }),
    }),
    ProjectModule,
    ShotModule,
    SeedanceModule,
    FFmpegModule,
    SettingsModule,
  ],
})
export class AppModule {}
