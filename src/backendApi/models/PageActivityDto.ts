/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PageActivityDto = {
    type: PageActivityDto.type;
    delegatee: string;
    delegator: string;
    amount: string;
    transaction: string;
    timestamp: number;
    chain: PageActivityDto.chain;
    protocol: PageActivityDto.protocol;
};
export namespace PageActivityDto {
    export enum type {
        DELEGATION = 'delegation',
        CLAIM = 'claim',
    }
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

