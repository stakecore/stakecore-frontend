/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ValidatorEpochApyDto } from './ValidatorEpochApyDto';
export type PChainValidatorInfoDto = {
    validatorNodeId: string;
    validatorTransactionHash: string;
    /**
     * True for the chain's default/highlighted validator. Exactly one entry per chain is featured.
     */
    featured: boolean;
    /**
     * Current (latest reward epoch) APY.
     */
    apy: number;
    /**
     * APY per reward epoch, up to the latest 25 epochs (empty where not tracked).
     */
    epochApys: Array<ValidatorEpochApyDto>;
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

