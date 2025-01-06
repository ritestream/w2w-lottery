import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('winner')
  getWinner(
    @Query('amount') amount: number,
    @Query('month') month: string,
  ): Promise<any> {
    return this.appService.getWinner(amount, month);
  }
}
