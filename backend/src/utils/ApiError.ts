import { ERROR_CODES, ErrorCodeKey } from '../constants/errorCodes';

export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: ErrorCodeKey;

    constructor(
        key: ErrorCodeKey,
        message?: string,
        isOperational: boolean = true
    ) {
        const errorDef = ERROR_CODES[key];
        // Usar mensaje por defecto, sino se proporciona uno se utiliza el pasado por parametro
        const finalMessage = message || errorDef.message;

        super(finalMessage);

        this.statusCode = errorDef.statusCode;
        this.code = key;
        this.isOperational = isOperational;

        // Capturar la traza de la pila
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
