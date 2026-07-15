import { Request, Response } from 'express';

import { ForbiddenException, TokenException } from 'aop/exceptions';
import { InputValidationException } from 'aop/exceptions/errors/validation';

import { validateAuthenticationInput, validateRefreshToken } from '../auth-middleware';

import config from 'config';
import constants from 'shared/constants';

/**
 * Verification: unit proofs for auth middleware (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/auth/registration.md
 * @see documentation/architecture/http/auth/logout.md
 * @see documentation/architecture/http/auth/refresh.md
 */

const validRegisterBody = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'SecureP@ss1',
    confirmationPassword: 'SecureP@ss1',
};

const validLoginBody = {
    email: 'john@example.com',
    password: 'SecureP@ss1',
};

describe('auth-middleware', () => {
    const originalEnableRegistration = config.enableRegistration;

    afterEach(() => {
        config.enableRegistration = originalEnableRegistration;
    });

    describe('validateAuthenticationInput', () => {
        describe('[HTTP-AUTH-REG-004]', () => {
            it('throws ForbiddenException on register when registration is disabled', () => {
                config.enableRegistration = false;
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.auth.register,
                    body: validRegisterBody,
                } as Request;

                expect(() => validateAuthenticationInput(request, {} as Response, mockNext)).toThrow(
                    ForbiddenException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        describe('[HTTP-AUTH-REG-001]', () => {
            it('calls next with a validated register body when registration is enabled', () => {
                config.enableRegistration = true;
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.auth.register,
                    body: validRegisterBody,
                } as Request;

                validateAuthenticationInput(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.body).toEqual(validRegisterBody);
            });
        });

        describe('[HTTP-AUTH-REG-003]', () => {
            it('rejects an invalid register body', () => {
                config.enableRegistration = true;
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.auth.register,
                    body: { ...validRegisterBody, email: 'not-an-email' },
                } as Request;

                expect(() => validateAuthenticationInput(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });

            it('rejects when confirmation password does not match', () => {
                config.enableRegistration = true;
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.auth.register,
                    body: { ...validRegisterBody, confirmationPassword: 'SecureP@ss1X' },
                } as Request;

                expect(() => validateAuthenticationInput(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        describe('[HTTP-AUTH-LOG-001]', () => {
            it('calls next with a validated login body', () => {
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.auth.login,
                    body: validLoginBody,
                } as Request;

                validateAuthenticationInput(request, {} as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(request.body).toEqual(validLoginBody);
            });
        });

        describe('[FR-AUTH-LOG-006]', () => {
            it('rejects an invalid login body', () => {
                const mockNext = vi.fn();
                const request = {
                    path: constants.routes.auth.login,
                    body: { email: 'not-an-email', password: 'short' },
                } as Request;

                expect(() => validateAuthenticationInput(request, {} as Response, mockNext)).toThrow(
                    InputValidationException
                );
                expect(mockNext).not.toHaveBeenCalled();
            });
        });
    });

    describe('validateRefreshToken', () => {
        describe('[HTTP-AUTH-OUT-001]', () => {
            it('throws TokenException when the refresh cookie is missing on logout', () => {
                const mockNext = vi.fn();
                const request = { cookies: {} } as Request;

                expect(() => validateRefreshToken(request, {} as Response, mockNext)).toThrow(TokenException);
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        describe('[HTTP-AUTH-REF-002]', () => {
            it('throws TokenException when the refresh cookie is missing on refresh', () => {
                const mockNext = vi.fn();
                const request = { cookies: undefined } as unknown as Request;

                expect(() => validateRefreshToken(request, {} as Response, mockNext)).toThrow(TokenException);
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        it('calls next when the refresh cookie is present', () => {
            const mockNext = vi.fn();
            const request = {
                cookies: { [constants.http.cookies.refreshToken]: 'refresh-jwt' },
            } as unknown as Request;

            validateRefreshToken(request, {} as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
