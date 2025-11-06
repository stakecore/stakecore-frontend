/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_AvalancheDelegatorInfoDto } from '../models/ApiResponseDto_AvalancheDelegatorInfoDto';
import type { ApiResponseDto_AvalancheValidatorInfoDto } from '../models/ApiResponseDto_AvalancheValidatorInfoDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ValidatorService {
    /**
     * Frontend page info for the Avalanche validator
     * @returns ApiResponseDto_AvalancheValidatorInfoDto
     * @throws ApiError
     */
    public static validatorControllerGetAvalancheValidatorPageInfo(): CancelablePromise<ApiResponseDto_AvalancheValidatorInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/validator/avalanche/validator/info',
        });
    }
    /**
     * Information about Stakecore's delegator requested by a given C-Chain address and an optional P-Chain address
     * @param cChainAddress
     * @param pChainAddress User's explicit P-Chain address
     * @returns ApiResponseDto_AvalancheDelegatorInfoDto
     * @throws ApiError
     */
    public static validatorControllerGetAvalancheDelegatorInfo(
        cChainAddress: string,
        pChainAddress?: string,
    ): CancelablePromise<ApiResponseDto_AvalancheDelegatorInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/validator/avalanche/validator/delegator/{cChainAddress}',
            path: {
                'cChainAddress': cChainAddress,
            },
            query: {
                'pChainAddress': pChainAddress,
            },
        });
    }
}
