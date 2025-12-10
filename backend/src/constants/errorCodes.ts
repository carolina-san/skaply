export const ERROR_CODES = {
    // Errores del cliente
    BAD_REQUEST: { statusCode: 400, message: 'Bad Request' },
    UNAUTHORIZED: { statusCode: 401, message: 'Unauthorized' },
    FORBIDDEN: { statusCode: 403, message: 'Forbidden' },
    NOT_FOUND: { statusCode: 404, message: 'Not Found' },
    METHOD_NOT_ALLOWED: { statusCode: 405, message: 'Method Not Allowed' },
    CONFLICT: { statusCode: 409, message: 'Conflict' },
    UNPROCESSABLE: { statusCode: 422, message: 'Unprocessable Entity' },
    TOO_MANY_REQUESTS: { statusCode: 429, message: 'Too Many Requests' },

    //Errores del servidor
    INTERNAL_SERVER: { statusCode: 500, message: 'Internal Server Error' },
    NOT_IMPLEMENTED: { statusCode: 501, message: 'Not Implemented' },
    BAD_GATEWAY: { statusCode: 502, message: 'Bad Gateway' },
    SERVICE_UNAVAILABLE: { statusCode: 503, message: 'Service Unavailable' },
    GATEWAY_TIMEOUT: { statusCode: 504, message: 'Gateway Timeout' }
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODES;
