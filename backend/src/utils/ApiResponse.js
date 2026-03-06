/**
 * Standard API response format
 */
class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    static created(res, data = null, message = 'Created successfully') {
        return res.status(201).json({
            success: true,
            message,
            data,
        });
    }

    static error(res, message = 'Something went wrong', statusCode = 500, errors = []) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }
}

module.exports = ApiResponse;
