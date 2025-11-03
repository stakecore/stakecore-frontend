/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FspDelegatorRewardDto } from './FspDelegatorRewardDto';
import type { FspDelegatorTokenInfoDto } from './FspDelegatorTokenInfoDto';
export type FspDelegatorInfoDto = {
    delegated: number;
    rewards: Array<FspDelegatorRewardDto>;
    nat: FspDelegatorTokenInfoDto;
    wnat: FspDelegatorTokenInfoDto;
};

