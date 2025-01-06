import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getWinner(amount: number, month: string): Promise<any> {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }
      // get sum of ads_play_times for each address in the 2024-10 and 2024-11
      const adsRecord = await this.prisma.user_ads_records.findMany({
        where: {
          month: month,
          win: false,
        },
      });

      if (adsRecord.length === 0) {
        throw new Error('No record found');
      }

      const sumOfAdsPlayTimes = adsRecord.reduce((acc, record) => {
        if (!acc[record.address]) {
          acc[record.address] = 0;
        }
        acc[record.address] += Number(record.ads_play_times);
        return acc;
      }, {});
      const sumOfAdsPlayTimesArray = Object.entries(sumOfAdsPlayTimes).map(
        ([address, weight]) => ({
          address,
          weight,
        }),
      );

      const winner = this.weightedLottery(sumOfAdsPlayTimesArray);
      const winnerUser = await this.prisma.users.findUnique({
        where: {
          address: winner,
        },
      });
      if (!winnerUser) {
        throw new Error('No winner found');
      }
      //add winner history
      //update record flag as winned
      const [winner_records] = await this.prisma.$transaction([
        this.prisma.winner_records.create({
          data: {
            address: winner,
            amount,
            created_at: new Date(),
            user_id: winnerUser.id,
            month: month,
          },
        }),
        this.prisma.user_ads_records.updateMany({
          where: {
            address: winner,
            month: month,
            win: false,
            user_id: winnerUser.id,
          },
          data: {
            win: true,
          },
        }),
      ]);
      // return winner_records without id and user id and month;
      return {
        amount: winner_records.amount,
        address: winner_records.address,
        created_at: winner_records.created_at,
      };
    } catch (error) {
      console.log(error);
      throw new Error('Error');
    }
  }

  private weightedLottery(items) {
    // Calculate the total weight
    const totalWeight = items.reduce((total, item) => total + item.weight, 0);

    // Generate a random number between 0 and the total weight
    const randomNumber = Math.random() * totalWeight;

    // Find the item corresponding to the random number
    let cumulativeWeight = 0;
    for (const item of items) {
      cumulativeWeight += item.weight;
      if (randomNumber < cumulativeWeight) {
        return item.address;
      }
    }
  }
}
