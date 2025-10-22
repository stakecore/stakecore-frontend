export enum StatusCode {
  WALLET_CHOICE_SHOWN,
  WALLET_PROVIDER_OBTAINED,
  CONTRACT_CALL_EXECUTED
}

export type Status = StatusCode | string