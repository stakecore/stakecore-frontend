/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DebugService {
    /**
     * Throw a test error to verify Sentry capture (API key required)
     * @returns void
     * @throws ApiError
     */
    public static debugControllerGetError(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/debug-sentry',
            errors: {
                500: `Always throws; the error is reported to Sentry`,
            },
        });
    }
}
