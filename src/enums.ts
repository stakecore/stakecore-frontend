export enum StatusCode {
  WALLET_CHOICE_SHOWN,
  WALLET_PROVIDER_OBTAINED,
  CONTRACT_CALL_EXECUTED,
  CHAIN_SWITCH_REJECTED,
  ACCOUNT_REQUEST_REJECTED,
}

export type Status = StatusCode | string

export enum Chain { FLARE, SONGBIRD, AVALANCHE }

export enum Protocol { FSP, VALIDATOR }