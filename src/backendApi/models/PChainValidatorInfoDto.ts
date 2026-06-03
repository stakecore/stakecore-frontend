/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PChainValidatorInfoDto = {
    validatorNodeId: string;
    validatorTransactionHash: string;
    /**
     * True for the chain's default/highlighted validator. Exactly one entry per chain is featured.
     */
    featured: boolean;
    apy: number;
    minimumDelegated: number;
    validatorFee: number;
    /**
     * Amount staked by Stakecore on this specific validator, in the chain's native token.
     */
    validatorOwnedStake: number;
    validatorTotalStake: number;
    validatorAvailableCapacity: number;
    validatorStartTime: number;
    validatorEndTime: number;
    totalDelegators: number;
    totalDelegated: number;
    validatorNetworkShare: number;
    validatorUptime: number;
    pChainConnected: number;
    cChainConnected: number;
    xChainConnected: number;
};

