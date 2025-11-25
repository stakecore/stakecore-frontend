/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_FspDelegatorInfoDto } from '../models/ApiResponseDto_FspDelegatorInfoDto';
import type { ApiResponseDto_FspPageDataDto } from '../models/ApiResponseDto_FspPageDataDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FspService {
    /**
     * Frontend page info for the Flare FSP
     * @param chain
     * @returns ApiResponseDto_FspPageDataDto
     * @throws ApiError
     */
    public static fspControllerGetFlareFspPageInfo(
        chain: string,
    ): CancelablePromise<ApiResponseDto_FspPageDataDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fsp/info/{chain}',
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
