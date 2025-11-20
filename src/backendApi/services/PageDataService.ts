/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto_PageStatsDto } from '../models/ApiResponseDto_PageStatsDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PageDataService {
    /**
     * Stakecore frontend page info
     * @returns ApiResponseDto_PageStatsDto
     * @throws ApiError
     */
    public static pageControllerGetPageInfo(): CancelablePromise<ApiResponseDto_PageStatsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page/info',
        });
    }
}
