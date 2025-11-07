/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_PageStats } from '../models/ApiResponseDto_PageStats';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PageDataService {
    /**
     * Frontend page info for the Flare FSP
     * @returns ApiResponseDto_PageStats
     * @throws ApiError
     */
    public static pageControllerGetTotalDelegated(): CancelablePromise<ApiResponseDto_PageStats> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page/total-delegated',
        });
    }
}
