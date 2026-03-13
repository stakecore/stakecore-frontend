/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DelegationDto } from './DelegationDto';
import type { ProjectDelegationDto } from './ProjectDelegationDto';
import type { RewardClaimDto } from './RewardClaimDto';
export type PageStatsDto = {
    delegated: Array<ProjectDelegationDto>;
    delegations: Array<DelegationDto>;
    rewards: Array<RewardClaimDto>;
    historicDelegations: Array<ProjectDelegationDto>;
};

