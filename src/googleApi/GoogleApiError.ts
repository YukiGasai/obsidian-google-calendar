import type { ApiRequestData } from "../helper/types";

export class GoogleApiError extends Error {

    request: ApiRequestData;
    status: number;
    response: any;

    constructor(message: string, request: ApiRequestData, status: number, response: any) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, GoogleApiError.prototype);
        this.request = request;
        this.status = status;
        this.response = response;
    }

    sayHello() {
        return "hello " + this.message;
    }
}