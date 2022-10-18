import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { getEthRPCProvider } from './contractAddressMap';
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
    const positionCall = positionManagerContract.positions(params.tokenId);
    const feesCall = positionManagerContract.callStatic.collect(
      {
        tokenId: ethers.BigNumber.from(params.tokenId).toHexString(),
        recipient: params.owner, // some tokens might fail if transferred to address(0)
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
      },
      { from: params.owner }, // need to simulate the call as the owner
    );
    const [position, fees] = await Promise.all([positionCall, feesCall]);

    return { position, fees };
  }
}

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
