/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RewardClaimDto = {
    chain: RewardClaimDto.chain;
    protocol: RewardClaimDto.protocol;
    delegatee: string;
    recipient: string;
    reward: string;
    transaction: string;
    timestamp: number;
};
export namespace RewardClaimDto {
    export enum chain {
        '_0' = 0,
        '_1' = 1,
        '_2' = 2,
    }
    export enum protocol {
        '_0' = 0,
        '_1' = 1,
    }
}

