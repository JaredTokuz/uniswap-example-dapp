import { Controller, Get, Query } from '@nestjs/common';
import { tickToPrice } from '@uniswap/v3-sdk';
import {
  AppService,
  CollectFeeResponse,
  PositionResponse,
} from './app.service';
import { createToken, formatFee } from './contractAddressMap';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('position')
  async getPosition(
    @Query() query: { chainId: string; tokenId: string; owner: string },
  ): Promise<any> {
    if (!query.chainId || !query.tokenId || !query.owner)
      throw 'request missing arguments';
    const data = await this.appService.getPositionData({ ...query });
    const tokenA = createToken(
      query.chainId,
      data.position[PositionResponse.token0],
    );
    const tokenB = createToken(
      query.chainId,
      data.position[PositionResponse.token1],
    );

    const priceLower = tickToPrice(
      tokenA,
      tokenB,
      data.position[PositionResponse.tickLower],
    );
    const priceUpper = tickToPrice(
      tokenA,
      tokenB,
      data.position[PositionResponse.tickUpper],
    );

    const positionMetrics = {
      tickLower: priceLower.toFixed(6),
      tickUpper: priceUpper.toFixed(6),
      pair: {
        [tokenA.symbol]: {
          fee: formatFee(
            query.chainId,
            tokenA.address,
            data.fees[CollectFeeResponse.amount0],
          ),
        },
        [tokenB.symbol]: {
          fee: formatFee(
            query.chainId,
            tokenB.address,
            data.fees[CollectFeeResponse.amount1],
          ),
        },
      },
    };

    return positionMetrics;
  }
}
