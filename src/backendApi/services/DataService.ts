/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_AvalancheValidatorInfoDto } from '../models/ApiResponseDto_AvalancheValidatorInfoDto';
import type { ApiResponseDto_FlareDelegationTimeSeriesDto } from '../models/ApiResponseDto_FlareDelegationTimeSeriesDto';
import type { ApiResponseDto_FlareDelegatorsDto } from '../models/ApiResponseDto_FlareDelegatorsDto';
import type { ApiResponseDto_FlareFspInfoDto } from '../models/ApiResponseDto_FlareFspInfoDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DataService {
    /**
     * Frontend page info for the Avalanche validator
     * @returns ApiResponseDto_AvalancheValidatorInfoDto
     * @throws ApiError
     */
    public static dataControllerGetAvalancheValidatorPageInfo(): CancelablePromise<ApiResponseDto_AvalancheValidatorInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/data/avalanche/validator/info',
        });
    }
    /**
     * Frontend page info for the Flare FSP
     * @returns ApiResponseDto_FlareFspInfoDto
     * @throws ApiError
     */
    public static dataControllerGetFlareFspPageInfo(): CancelablePromise<ApiResponseDto_FlareFspInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/data/flare/fsp/info',
        });
    }
    /**
     * Flare Delegators
     * @param delegatee
     * @returns ApiResponseDto_FlareDelegatorsDto
     * @throws ApiError
     */
    public static dataControllerGetFlareDelegators(
        delegatee: string,
    ): CancelablePromise<ApiResponseDto_FlareDelegatorsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/data/flare/fsp/delegators/{delegatee}',
            path: {
                'delegatee': delegatee,
            },
        });
    }
    /**
     * Timeseries of total delegated FLR over the last year
     * @returns ApiResponseDto_FlareDelegationTimeSeriesDto
     * @throws ApiError
     */
    public static dataControllerGetDelegatedTimeSeries(): CancelablePromise<ApiResponseDto_FlareDelegationTimeSeriesDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/data/flare/fsp/timeseries/delegated',
        });
    }
}
