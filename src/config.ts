export type Config = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ETHERSCAN_API_KEY: string;
  TOKEN_ADDRESS: `0x${string}`;
  PAIR_ADDRESS: `0x${string}`;
  POLL_INTERVAL_SEC: number;
  CONFIRMATIONS: number;
  MIN_TOKENS: number;
  MIN_USD: number;
  WHALE_USD: number;
  NEW_WALLET_DAYS: number;
  PRICE_QUOTE_SIDE: 'WETH' | 'USDC';
  PUBLIC_RPC_URL: string;
  DRY_RUN: boolean;
};

export function loadConfig(): Config {
  const get = (k: string, req = true) => {
    const v = process.env[k];
    if (req && (!v || v.trim() === '')) throw new Error(`Missing env: ${k}`);
    return v!;
  };
  return {
    TELEGRAM_BOT_TOKEN: get('TELEGRAM_BOT_TOKEN'),
    TELEGRAM_CHAT_ID: get('TELEGRAM_CHAT_ID'),
    ETHERSCAN_API_KEY: get('ETHERSCAN_API_KEY'),
    TOKEN_ADDRESS: get('TOKEN_ADDRESS') as `0x${string}`,
    PAIR_ADDRESS: get('PAIR_ADDRESS') as `0x${string}`,
    POLL_INTERVAL_SEC: Number(get('POLL_INTERVAL_SEC')),
    CONFIRMATIONS: Number(get('CONFIRMATIONS')),
    MIN_TOKENS: Number(get('MIN_TOKENS')),
    MIN_USD: Number(get('MIN_USD')),
    WHALE_USD: Number(get('WHALE_USD')),
    NEW_WALLET_DAYS: Number(get('NEW_WALLET_DAYS')),
    PRICE_QUOTE_SIDE: (get('PRICE_QUOTE_SIDE') ?? 'WETH') as 'WETH' | 'USDC',
    PUBLIC_RPC_URL: get('PUBLIC_RPC_URL'),
    DRY_RUN: (get('DRY_RUN', false) ?? 'false').toLowerCase() === 'true'
  };
}
