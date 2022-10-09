import { Injectable } from '@nestjs/common';
import { Console } from 'console';
import { ethers } from 'ethers';
import { getPositionManagerAbi } from './NonfungiblePositionManager';

const NFTPositionManagerABI = getPositionManagerAbi();

const MAX_UINT128 = ethers.BigNumber.from(2).pow(128).sub(1);

@Injectable()
export class AppService {
  async getPositionData(params: {
    chainId: string;
    tokenId: string;
    owner: string;
  }): Promise<{ position: any; fees: any }> {
    const positionManagerContract = uniswapV3PositionManager(params.chainId);
    const position = await positionManagerContract.positions(params.tokenId);
    const fees = await positionManagerContract.callStatic.collect(
      {
        tokenId: ethers.BigNumber.from(params.tokenId).toHexString(),
        recipient: params.owner, // some tokens might fail if transferred to address(0)
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
      },
      { from: params.owner }, // need to simulate the call as the owner
    );

    // console.log(position);
    // console.log(fees);
    // console.log(formatUnits(fees[0]));
    // console.log(formatUnits(fees[1], 6));

    return { position, fees };
  }
}

// default formatting coming from stack overflow
export const formatUnits = (amt: ethers.BigNumber, units?: number): string =>
  ethers.utils
    .formatUnits(ethers.BigNumber.from(amt).toString(), units || 18)
    .toString();

const getEthRPCProvider = (chainId: string) => {
  if (chainId == '10')
    return new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_URL);
  if (chainId == '137')
    return new ethers.providers.JsonRpcProvider(process.env.POLYGON_URL);
  throw 'no matching chainId provided';
};

const uniswapV3PositionManager = (chainId: string) => {
  const provider = getEthRPCProvider(chainId);
  const uniswap_v3_nonfungiblePositionManager =
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
  const positionContract = new ethers.Contract(
    uniswap_v3_nonfungiblePositionManager,
    NFTPositionManagerABI,
    provider,
  );
  return positionContract;
};

export enum PositionResponse {
  nonce,
  operator,
  token0,
  token1,
  fee,
  tickLower,
  tickUpper,
  liquidity,
  feeGrowthInside0LastX128,
  feeGrowthInside1LastX128,
  tokensOwed0,
  tokensOwed1,
}

export enum CollectFeeResponse {
  amount0,
  amount1,
}
