/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto } from '../models/ApiResponseDto';
import type { ApiResponseDto_PageStatsDto } from '../models/ApiResponseDto_PageStatsDto';
import type { ApiResponseDto_PageUserInfoDto } from '../models/ApiResponseDto_PageUserInfoDto';
import type { FormDto } from '../models/FormDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LandingPageService {
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
    /**
     * Stakecore user info
     * @param user
     * @returns ApiResponseDto_PageUserInfoDto
     * @throws ApiError
     */
    public static pageControllerGetUserInfo(
        user: string,
    ): CancelablePromise<ApiResponseDto_PageUserInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page/info/{user}',
            path: {
                'user': user,
            },
        });
    }
    /**
     * Submit form data
     * @param requestBody
     * @returns ApiResponseDto Successful form submission
     * @throws ApiError
     */
    public static pageControllerSubmitForm(
        requestBody: FormDto,
    ): CancelablePromise<ApiResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/page/form/submit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all messages
     * @returns ApiResponseDto Fetched all messages
     * @throws ApiError
     */
    public static pageControllerGetMessages(): CancelablePromise<ApiResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/page/form/messages',
        });
    }
}
