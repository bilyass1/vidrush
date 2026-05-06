import { Module } from '@nestjs/common';
import { Flux2Controller } from './flux2.controller';
import { Flux2Service } from './flux2.service';

@Module({
  controllers: [Flux2Controller],
  providers: [Flux2Service],
  exports: [Flux2Service],
})
export class Flux2Module {}
