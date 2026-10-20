import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE } from './mail.constants';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './mail.processor';
import { MailerService } from './mailer.service';

function redisEnabledFromEnv(): boolean {
  return process.env.REDIS_ENABLED === 'true';
}

@Module({})
export class MailModule {
  static forRoot(): DynamicModule {
    const useRedis = redisEnabledFromEnv();

    return {
      module: MailModule,
      global: true,
      imports: [
        ConfigModule,
        ...(useRedis
          ? [
              BullModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                  connection: {
                    url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
                  },
                }),
              }),
              BullModule.registerQueue({ name: EMAIL_QUEUE }),
            ]
          : []),
      ],
      providers: [
        MailerService,
        MailQueueService,
        ...(useRedis
          ? [MailProcessor]
          : [{ provide: getQueueToken(EMAIL_QUEUE), useValue: null }]),
      ],
      exports: [MailerService, MailQueueService],
    };
  }
}
