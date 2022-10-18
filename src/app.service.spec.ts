import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  calculateLiquidityUSD,
  createPosition,
  formatUnits,
  getPool,
  PositionResponse,
} from './contractAddressMap';

describe('AppController', () => {
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return position data for an nft', async () => {
      const response = await appService.getPositionData({
        chainId: '10',
        tokenId: '172653',
        owner: '0x5231555186e4502bdB603c9E42Ae47f93C54d99D',
      });
      expect(response).toBeTruthy();
      console.log(response);

      console.log(response.position[PositionResponse.liquidity]);
      console.log(formatUnits(response.position[PositionResponse.liquidity]));
    });
  });

  it.only('should return position data for an nft', async () => {
    const token0 = 'WMATIC';
    const token1 = 'USDC';
    const chainId = '137';
    const pool = await getPool(chainId, token0, token1);
    const response = await appService.getPositionData({
      chainId: chainId,
      tokenId: '383661',
      owner: '0x5231555186e4502bdB603c9E42Ae47f93C54d99D',
    });
    const position = createPosition(
      pool,
      response.position[PositionResponse.liquidity],
      response.position[PositionResponse.tickLower],
      response.position[PositionResponse.tickUpper],
    );

    console.log(pool.token0Price.toFixed(4), position.amount0.toFixed(4));
    console.log(pool.token1Price.toFixed(4), position.amount1.toFixed(4));

    const token0Liquidity = calculateLiquidityUSD(
      token0,
      pool.token0Price,
      position.amount0,
    );
    const token1Liquidity = calculateLiquidityUSD(
      token1,
      pool.token1Price,
      position.amount1,
    );

    console.log(
      token0Liquidity,
      token1Liquidity,
      token0Liquidity + token1Liquidity,
    );
  });
});
