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
 * Validates register/login body against Zod schemas; gates registration when disabled.
 *
 * FR-AUTH-REG-003 / FR-AUTH-PWD-001 — Reject invalid register fields / password policy / confirmation mismatch
 * FR-AUTH-REG-004 — Reject register when ENABLE_REGISTRATION is false
 * FR-AUTH-LOG-006 — Reject login when required credentials are missing/invalid (schema)
 */
const validateAuthenticationInput = (req: Request, _res: Response, next: NextFunction) => {
    const isRegistering = req.path === constants.routes.auth.register;

    // FR-AUTH-REG-004
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
 * Requires a refreshToken cookie for logout and access-token refresh.
 *
 * FR-AUTH-OUT-003 — Reject logout without refresh credential
 * FR-AUTH-REF-002 — Reject renewal without refresh credential
 */
const validateRefreshToken = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.cookies?.[constants.http.cookies.refreshToken]) {
        throw new TokenException(ErrorMessage.REFRESH_TOKEN_COOKIE_NOT_FOUND);
    }

    next();
};

export { validateAuthenticationInput, validateRefreshToken };
