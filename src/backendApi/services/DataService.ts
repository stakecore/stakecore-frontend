/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDtoWithModel } from '../models/ApiResponseDtoWithModel';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DataService {
    /**
     * Frontend Page Info For The Avalanche Validator
     * @returns ApiResponseDtoWithModel
     * @throws ApiError
     */
    public static dataControllerGetAvalanchePageInfo(): CancelablePromise<ApiResponseDtoWithModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/data/avalanche/validator/info',
        });
    }
}
