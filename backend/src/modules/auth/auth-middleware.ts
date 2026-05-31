import { type NextFunction, type Request, type Response } from 'express';

import { TokenException } from 'aop/exceptions';
import { ForbiddenException } from 'aop/exceptions/errors/authentication';
import { validateRequestPayload } from 'aop/http/validators/validators-request-payload';

import config from 'config';
import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';

import { registerUserInputSchema } from './schemas';
import { loginUserInputSchema } from './schemas';

/**
 * Validates that the request body adhears to the corresponding schema.
 */
const validateAuthenticationInput = (req: Request, _res: Response, next: NextFunction) => {
    // Determine schema based on the request path
    const isRegistering = req.path === constants.routes.auth.register;

    /**
     * Determine if registration is disabled.
     */
    if (isRegistering && !config.enableRegistration) {
        throw new ForbiddenException(ErrorMessage.REGISTRATION_DISABLED);
    }

    const schema = isRegistering ? registerUserInputSchema : loginUserInputSchema;

    const validatedPayload = validateRequestPayload(
        schema,
        req.body,
        ErrorMessage.AUTHENTICATION_SCHEMA_VALIDATION_FAILED
    );

    req.body = validatedPayload;

    next();
};

/**
 * Validates that a refreshToken request cookie exists.
 */
const validateRefreshToken = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.cookies?.[constants.http.cookies.refreshToken]) {
        throw new TokenException(ErrorMessage.REFRESH_TOKEN_COOKIE_NOT_FOUND);
    }

    next();
};

export { validateAuthenticationInput, validateRefreshToken };
