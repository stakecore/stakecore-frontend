/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDto } from '../models/ApiResponseDto';
import type { FormDto } from '../models/FormDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FormService {
    /**
     * Submit form data
     * @param requestBody
     * @returns ApiResponseDto Successful form submission
     * @throws ApiError
     */
    public static formControllerSubmitForm(
        requestBody: FormDto,
    ): CancelablePromise<ApiResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/form/submit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all messages
     * @returns ApiResponseDto Fetched all messages
     * @throws ApiError
     */
    public static formControllerGetMessages(): CancelablePromise<ApiResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/form/messages',
        });
    }
}
