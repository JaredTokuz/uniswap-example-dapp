import { Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

type TokenMapStruct = { [key: string]: { name: string; address: string } };

const OPTIMISM_CONTRACT_MAP: TokenMapStruct = {
  '0x7F5c764cBc14f9669B88837ca1490cCa17c31607': {
    name: 'USDC',
    address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  },
  '0x4200000000000000000000000000000000000006': {
    name: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
  },
};

const POLYGON_CONTRACT_MAP: TokenMapStruct = {
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
    name: 'USDC',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': {
    name: 'WETH',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  },
  '0x0000000000000000000000000000000000001010': {
    name: 'MATIC',
    address: '0x0000000000000000000000000000000000001010',
  },
  '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': {
    name: 'WMATIC',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  },
};

type TokenMiscStruct = { [key: string]: { decimal: number; rounding: number } };

export const TOKEN_MISC: TokenMiscStruct = {
  USDC: { decimal: 6, rounding: 2 },
  WETH: { decimal: 18, rounding: 4 },
  MATIC: { decimal: 18, rounding: 4 },
  WMATIC: { decimal: 18, rounding: 4 },
};

export const CHAIN_NETWORK = {
  '10': OPTIMISM_CONTRACT_MAP,
  '137': POLYGON_CONTRACT_MAP,
};

export const createToken = (chainId: string, tokenAddress: string) => {
  const tokenConfig = CHAIN_NETWORK[chainId][tokenAddress];
  const decimals = TOKEN_MISC[tokenConfig.name].decimal;
  const token = new Token(
    Number(chainId),
    tokenAddress,
    decimals,
    tokenConfig.name,
  );
  return token;
};

// default formatting coming from stack overflow
export const formatUnits = (amt: ethers.BigNumber, units?: number): string =>
  ethers.utils
    .formatUnits(ethers.BigNumber.from(amt).toString(), units || 18)
    .toString();

export const formatFee = (
  chainId: string,
  tokenAddr: string,
  feeAmount: ethers.BigNumber,
) => {
  const tokenName = CHAIN_NETWORK[chainId][tokenAddr].name;
  const feeAmt = Number(
    formatUnits(feeAmount, TOKEN_MISC[tokenName].decimal),
  ).toFixed(TOKEN_MISC[tokenName].rounding);
  return feeAmt;
};
