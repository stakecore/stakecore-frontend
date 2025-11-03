/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_FspDelegatorInfoDto } from '../models/ApiResponseDto_FspDelegatorInfoDto';
import type { ApiResponseDto_FspGraphicsDataDto } from '../models/ApiResponseDto_FspGraphicsDataDto';
import type { ApiResponseDto_FspInfoDto } from '../models/ApiResponseDto_FspInfoDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FspService {
    /**
     * Frontend page info for the Flare FSP
     * @param chain
     * @returns ApiResponseDto_FspInfoDto
     * @throws ApiError
     */
    public static fspControllerGetFlareFspPageInfo(
        chain: string,
    ): CancelablePromise<ApiResponseDto_FspInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fsp/info/{chain}',
            path: {
                'chain': chain,
            },
        });
    }
    /**
     * Frontend page graphics data for the Flare FSP
     * @param chain
     * @returns ApiResponseDto_FspGraphicsDataDto
     * @throws ApiError
     */
    public static fspControllerGetFlareFspGraphicsData(
        chain: string,
    ): CancelablePromise<ApiResponseDto_FspGraphicsDataDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fsp/graphics/{chain}',
            path: {
                'chain': chain,
            },
        });
    }
    /**
     * Status of a Flare FSP delegator
     * @param chain
     * @param delegator
     * @returns ApiResponseDto_FspDelegatorInfoDto
     * @throws ApiError
     */
    public static fspControllerGetFlareFspDelegatorInfo(
        chain: string,
        delegator: string,
    ): CancelablePromise<ApiResponseDto_FspDelegatorInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fsp/delegator-info/{chain}/{delegator}',
            path: {
                'chain': chain,
                'delegator': delegator,
            },
        });
    }
}
