/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_AvalancheDelegatorInfoDto } from '../models/ApiResponseDto_AvalancheDelegatorInfoDto';
import type { ApiResponseDto_AvalancheValidatorInfoDto } from '../models/ApiResponseDto_AvalancheValidatorInfoDto';
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
     * Information about Stakecore's delegator given as an eip-55 checksummed hex string
     * @param delegator
     * @returns ApiResponseDto_AvalancheDelegatorInfoDto
     * @throws ApiError
     */
    public static dataControllerGetAvalancheDelegatorInfo(
        delegator: string,
    ): CancelablePromise<ApiResponseDto_AvalancheDelegatorInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/data/avalanche/validator/delegator-info/{delegator}',
            path: {
                'delegator': delegator,
            },
        });
    }
}
