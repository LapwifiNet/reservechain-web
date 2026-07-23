import { Module } from '@nestjs/common';
import { SensitiveController } from './sensitive.controller';

@Module({ controllers: [SensitiveController] })
export class SensitiveModule {}
