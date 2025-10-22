/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlareFspDelegatorRewardDto } from './FlareFspDelegatorRewardDto';
import type { FlareFspDelegatorTokenInfoDto } from './FlareFspDelegatorTokenInfoDto';
export type FlareFspDelegatorInfoDto = {
    delegated: number;
    rewards: Array<FlareFspDelegatorRewardDto>;
    nat: FlareFspDelegatorTokenInfoDto;
    wnat: FlareFspDelegatorTokenInfoDto;
};

