/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthDto } from '../models/HealthDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Liveness/readiness probe
     * @returns HealthDto Service is healthy
     * @throws ApiError
     */
    public static healthControllerHealth(): CancelablePromise<HealthDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
            errors: {
                503: `A dependency is unavailable`,
            },
        });
    }
}
