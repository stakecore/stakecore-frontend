/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvalancheDelegationDto } from './AvalancheDelegationDto';
import type { AvalancheSubChainBalanceDto } from './AvalancheSubChainBalanceDto';
export type AvalancheDelegatorInfoDto = {
    cChain: AvalancheSubChainBalanceDto;
    pChain: AvalancheSubChainBalanceDto;
    delegations: Array<AvalancheDelegationDto>;
};

