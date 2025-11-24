/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DelegationDto = {
    chain: DelegationDto.chain;
    protocol: DelegationDto.protocol;
    delegatee: string;
    delegator: string;
    delegated: string;
    transaction: string;
    timestamp: number;
};
export namespace DelegationDto {
    export enum chain {
        '_0' = 0,
        '_1' = 1,
    }
    export enum protocol {
        '_0' = 0,
        '_1' = 1,
    }
}

