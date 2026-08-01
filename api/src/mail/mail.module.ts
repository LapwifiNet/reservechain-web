import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

/** Mail delivery module — exposes MailService where waitlist wiring needs it. */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
