import { getQueueToken } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE, type EmailJobPayload } from './mail.constants';
import { MailerService } from './mailer.service';

@Injectable()
export class MailQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private readonly redisEnabled: boolean;
  private inlineChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
    @Optional()
    @Inject(getQueueToken(EMAIL_QUEUE))
    private readonly queue?: Queue<EmailJobPayload> | null
  ) {
    this.redisEnabled = this.config.get<boolean>('REDIS_ENABLED', false) && !!this.queue;
    if (!this.redisEnabled) {
      this.logger.warn(
        'REDIS_ENABLED=false — email jobs run in-process (no Redis queue).'
      );
    } else {
      this.logger.log('Email jobs will be processed via Redis/BullMQ queue.');
    }
  }

  async enqueue(payload: EmailJobPayload): Promise<void> {
    if (this.redisEnabled && this.queue) {
      await this.queue.add(payload.type, payload, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      });
      return;
    }

    this.inlineChain = this.inlineChain
      .then(() => this.mailer.send(payload))
      .catch((err: unknown) => {
        this.logger.error(
          `Inline email job failed (${payload.type} → ${payload.to})`,
          err instanceof Error ? err.stack : String(err)
        );
      });
  }

  async onModuleDestroy() {
    await this.inlineChain;
  }
}
