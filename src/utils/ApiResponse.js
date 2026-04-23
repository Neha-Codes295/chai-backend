class ApiResponse {
    constructor(successCode, message="Success", data) {
        this.successCode = successCode;
        this.message = message;
        this.data = data;
        this.success = successCode < 400;
    }
}

export { ApiResponse }