import { BigintIsh, CurrencyAmount, Price, Token } from '@uniswap/sdk-core';
import { Pool, Position } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

type TokenMapStruct = {
  [key: string]: { name: string; address: string };
};

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

const OPTIMISM_POOLS = [
  {
    name: 'WETH / USDC',
    address: '0x85149247691df622eaF1a8Bd0CaFd40BC45154a9',
    tokens: ['WETH', 'USDC'],
  },
];

const POLYGON_POOLS = [
  {
    name: 'WETH / USDC',
    address: '0x45dDa9cb7c25131DF268515131f647d726f50608',
    tokens: ['WETH', 'USDC'],
  },
  {
    name: 'WETH / USDC',
    address: '0xA374094527e1673A86dE625aa59517c5dE346d32',
    tokens: ['WMATIC', 'USDC'],
  },
];

export const CHAIN_NETWORK_POOLS = {
  '10': OPTIMISM_POOLS,
  '137': POLYGON_POOLS,
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

export const getEthRPCProvider = (chainId: string) => {
  if (chainId == '10')
    return new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_URL);
  if (chainId == '137')
    return new ethers.providers.JsonRpcProvider(process.env.POLYGON_URL);
  throw 'no matching chainId provided';
};

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

async function getPoolImmutables(poolContract: ethers.Contract) {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
    await Promise.all([
      poolContract.factory(),
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.maxLiquidityPerTick(),
    ]);

  const immutables: Immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  };
  return immutables;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

async function getPoolState(poolContract: ethers.Contract) {
  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const PoolState: State = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

async function createPool(
  poolContract: ethers.Contract,
  token0Name: string,
  token1Name: string,
) {
  const [immutables, state] = await Promise.all([
    getPoolImmutables(poolContract),
    getPoolState(poolContract),
  ]);

  const TokenA = new Token(
    10,
    immutables.token0,
    TOKEN_MISC[token0Name].decimal,
    token0Name,
  );
  const TokenB = new Token(
    10,
    immutables.token1,
    TOKEN_MISC[token1Name].decimal,
    token1Name,
  );

  const poolExample = new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick,
  );
  return poolExample;
}

export const getPoolContract = (
  chainId: string,
  token0Name: string,
  token1Name: string,
) => {
  const poolMap = CHAIN_NETWORK_POOLS[chainId].find(
    (x: any) => x.tokens.includes(token0Name) && x.tokens.includes(token1Name),
  );
  if (!poolMap) throw 'pool not matched';
  const poolAddress = poolMap.address;
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    getEthRPCProvider(chainId),
  );
  return poolContract;
};

export const getPool = async (
  chainId: string,
  token0Name: string,
  token1Name: string,
) => {
  const poolContract = getPoolContract(chainId, token0Name, token1Name);
  const pool = await createPool(poolContract, token0Name, token1Name);
  return pool;
};

export const createPosition = (
  pool: Pool,
  liquidity: BigintIsh,
  tickLower: number,
  tickUpper: number,
) => {
  return new Position({
    pool,
    liquidity: liquidity.toString(),
    tickLower,
    tickUpper,
  });
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

export const calculateLiquidityUSD = (
  tokenName: string,
  poolPrice: Price<Token, Token>,
  positionAmount: CurrencyAmount<Token>,
) => {
  if (tokenName == 'USDC') return Number(positionAmount.toFixed(4));
  return Number(poolPrice.quote(positionAmount).toFixed(4));
};

export interface TotalPositionInputParams {
  chainId: string;
  token0Name: string;
  token1Name: string;
  position: any;
}

export const totalPositionLiquidityUSD = async ({
  chainId,
  position,
  token0Name,
  token1Name,
}: TotalPositionInputParams) => {
  const pool = await getPool(chainId, token0Name, token1Name);
  const _position = createPosition(
    pool,
    position[PositionResponse.liquidity],
    position[PositionResponse.tickLower],
    position[PositionResponse.tickUpper],
  );
  const token0Liquidity = calculateLiquidityUSD(
    token0Name,
    pool.token0Price,
    _position.amount0,
  );
  const token1Liquidity = calculateLiquidityUSD(
    token1Name,
    pool.token1Price,
    _position.amount1,
  );
  return token0Liquidity + token1Liquidity;
};
