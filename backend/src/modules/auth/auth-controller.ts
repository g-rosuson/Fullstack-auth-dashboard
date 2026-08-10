import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { TokenException, UnauthorizedException } from 'aop/exceptions';
import { parseSchema } from 'lib/validation';

import utils from './utils';
import config from 'config';
import constants from 'shared/constants';

import { CreateUserPayload, RegisterUserInput } from './types';
import { LoginUserInput } from './types';
import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';
import { JwtPayload } from 'shared/types/jwt';

import jwtService from 'services/jwt';
import { jwtPayloadSchema } from 'shared/schemas/jwt';

/**
 * Registers a new user and establishes a session.
 *
 * FR-AUTH-REG-001 — Accept first name, last name, email, password (+ confirmation via middleware)
 * FR-AUTH-REG-002 — Duplicate email rejected at persistence (indexed unique email)
 * FR-AUTH-REG-005 / FR-AUTH-TOK-001 / FR-AUTH-TOK-002 — Issue access token in body + refresh cookie
 * NFR-SEC-AUTH-001 — Persist bcrypt hash with cost factor 10 (never plain text)
 * NFR-SEC-AUTH-003 — Refresh credential as HttpOnly / SameSite=Strict / Path=/ cookie (Secure outside dev)
 */
const register = async (req: Request<unknown, unknown, RegisterUserInput>, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    // NFR-SEC-AUTH-001
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: CreateUserPayload = {
        firstName,
        lastName,
        password: hashedPassword,
        email,
    };

    // FR-AUTH-REG-002 — Collection is indexed so duplicate emails throw a duplicate key error
    const insertResponse = await req.context.db.repository.users.create(newUser);

    // FR-AUTH-TOK-001 / FR-AUTH-TOK-002
    const tokenPayload: JwtPayload = {
        firstName,
        lastName,
        email,
        id: insertResponse.insertedId.toString(),
    };

    const { accessToken, refreshToken } = jwtService.createTokens(tokenPayload);

    // NFR-SEC-AUTH-003 — refresh never in JSON body
    res.cookie(constants.http.cookies.refreshToken, refreshToken, utils.getRefreshCookieOptions());

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: accessToken,
        meta: { timestamp: new Date().toISOString() },
    });
};

/**
 * Authenticates with email and password and establishes a session.
 *
 * FR-AUTH-LOG-001 / FR-AUTH-LOG-003 — Valid credentials → session (TOK-001 / TOK-002)
 * FR-AUTH-LOG-002 / NFR-SEC-AUTH-011 — Unknown email and wrong password use the same failure type
 * NFR-SEC-AUTH-001 — Compare against bcrypt hash
 * NFR-SEC-AUTH-003 — Refresh cookie attributes
 */
const login = async (req: Request<unknown, unknown, LoginUserInput>, res: Response) => {
    const { email, password } = req.body;

    const userDocument = await req.context.db.repository.users.getByEmail(email);

    // FR-AUTH-LOG-002 / NFR-SEC-AUTH-011
    if (!userDocument) {
        throw new UnauthorizedException(ErrorMessage.USER_NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(password, userDocument.password);

    // FR-AUTH-LOG-002 / NFR-SEC-AUTH-011
    if (!isPasswordValid) {
        throw new UnauthorizedException(ErrorMessage.USER_PASSWORD_WRONG);
    }

    const tokenPayload: JwtPayload = {
        firstName: userDocument.firstName,
        lastName: userDocument.lastName,
        email: userDocument.email,
        id: userDocument._id.toString(),
    };

    const { accessToken, refreshToken } = jwtService.createTokens(tokenPayload);

    res.cookie(constants.http.cookies.refreshToken, refreshToken, utils.getRefreshCookieOptions());

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: accessToken,
        meta: { timestamp: new Date().toISOString() },
    });
};

/**
 * Ends the session by clearing the refresh cookie.
 *
 * FR-AUTH-OUT-001 — End session / invalidate refresh credential (clear cookie)
 * Middleware: FR-AUTH-OUT-003 — Reject when refresh cookie missing (`validateRefreshToken`)
 */
const logout = async (_req: Request, res: Response) => {
    res.clearCookie(constants.http.cookies.refreshToken, utils.getRefreshCookieOptions(false));

    res.status(HttpStatusCode.OK).json({
        success: true,
        meta: { timestamp: new Date().toISOString() },
    });
};

/**
 * Issues a new access token from a valid refresh cookie.
 *
 * FR-AUTH-REF-001 / FR-AUTH-TOK-001 — Valid refresh → new access token
 * FR-AUTH-REF-003 / FR-AUTH-TOK-004 — Reject malformed refresh identity claims
 * Middleware: FR-AUTH-REF-002 / FR-AUTH-OUT-003 — Missing cookie (`validateRefreshToken`)
 */
const renewAccessToken = async (req: Request, res: Response) => {
    // Note: When the JWT is invalid "verify" throws (handled as TokenException upstream)
    const decoded = verify(req.cookies.refreshToken, config.refreshTokenSecret);

    // FR-AUTH-TOK-004 / FR-AUTH-REF-003
    const result = parseSchema(jwtPayloadSchema, decoded);

    if (!result.success) {
        throw new TokenException(ErrorMessage.TOKEN_INVALID);
    }

    const { accessToken } = jwtService.createTokens(result.data);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: accessToken,
        meta: { timestamp: new Date().toISOString() },
    });
};

export { renewAccessToken, register, logout, login };
