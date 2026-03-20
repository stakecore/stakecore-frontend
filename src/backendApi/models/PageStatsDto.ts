/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageActivityDto } from './PageActivityDto';
import type { ProjectDelegationDto } from './ProjectDelegationDto';
export type PageStatsDto = {
    delegated: Array<ProjectDelegationDto>;
    activity: Array<PageActivityDto>;
    historicDelegations: Array<ProjectDelegationDto>;
};

