/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type HealthDto = {
    status: HealthDto.status;
    db: HealthDto.db;
    /**
     * Process uptime in seconds
     */
    uptime: number;
};
export namespace HealthDto {
    export enum status {
        OK = 'ok',
        ERROR = 'error',
    }
    export enum db {
        UP = 'up',
        DOWN = 'down',
    }
}

