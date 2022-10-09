import { Controller, Get, Param, Query } from '@nestjs/common';
import { BigNumber } from 'ethers';
import {
  AppService,
  CollectFeeResponse,
  formatUnits,
  PositionResponse,
} from './app.service';
import { CHAIN_NETWORK, TOKEN_CONFIG } from './contractAddressMap';

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
    const fee0 = createFeeString(
      query.chainId,
      data.position[PositionResponse.token0],
      data.fees[CollectFeeResponse.amount0],
    );
    const fee1 = createFeeString(
      query.chainId,
      data.position[PositionResponse.token1],
      data.fees[CollectFeeResponse.amount1],
    );
    const feeData = [fee0, fee1];
    return feeData;
  }
}

const createFeeString = (
  chainId: string,
  tokenAddr: string,
  feeAmount: BigNumber,
) => {
  const tokenName = CHAIN_NETWORK[chainId][tokenAddr].name;
  const feeAmt = Number(
    formatUnits(feeAmount, TOKEN_CONFIG[tokenName].decimal),
  ).toFixed(TOKEN_CONFIG[tokenName].rounding);
  return `${tokenName}: ${feeAmt}`;
};
