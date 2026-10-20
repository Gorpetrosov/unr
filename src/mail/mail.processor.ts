import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EMAIL_QUEUE, type EmailJobPayload } from './mail.constants';
import { MailerService } from './mailer.service';

@Processor(EMAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    this.logger.debug(`Processing email job ${job.id} (${job.data.type})`);
    await this.mailer.send(job.data);
  }
}
