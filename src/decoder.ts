import { Interface } from 'ethers';

export const IUniswapV2Pair = new Interface([
  'event Swap(address indexed sender,uint amount0In,uint amount1In,uint amount0Out,uint amount1Out,address indexed to)'
]);

export const IERC20 = new Interface([
  'event Transfer(address indexed from,address indexed to,uint256 value)'
]);

export const SWAP_SIG = IUniswapV2Pair.getEvent('Swap')!.topicHash;
export const TRANSFER_SIG = IERC20.getEvent('Transfer')!.topicHash;
