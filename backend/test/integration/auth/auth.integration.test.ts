import { ErrorCode } from 'aop/exceptions/shared/enums';

import { INTEGRATION_AUTH_PASSWORD } from './constants';
import { mapToRegisterPayload } from './mappers';
import config from 'config';
import constants from 'shared/constants';

import type { Express } from 'express';

import { clearCollections, deleteCronJobs, disconnectMongo, getAgent, initServer } from '../harness';
import { expectRefreshTokenClearCookie, expectRefreshTokenCookieContract, expectValidAccessToken } from './expect';

/** Email fixed for auth-route scenarios that assume a single registered user. */
const mockEmail = 'email@example.com';

const mockRegisterPayload = mapToRegisterPayload(mockEmail);

/**
 * Integration: auth HTTP — real Mongo, bcrypt, cookies, and JWT verification.
 *
 * Cites docs/specs/architecture/http/auth (`HTTP-AUTH-*`).
 *
 * Note on HTTP-AUTH-TOK-003: missing `Authorization` currently fails as
 * `VALIDATION_ERROR` (400) via InputValidationException; invalid Bearer fails as
 * `AUTHENTICATION_ERROR` (401). The architecture doc specifies 401 for both.
 */

describe('Integration: auth HTTP', () => {
    let app: Express;
    let agent: ReturnType<typeof getAgent>;

    beforeAll(async () => {
        app = await initServer();
        agent = getAgent(app);
    });

    beforeEach(async () => {
        await deleteCronJobs();
        await clearCollections();
    });

    afterAll(async () => {
        await deleteCronJobs();
        await clearCollections();
        await disconnectMongo();
    });

    describe.sequential(`POST ${constants.routes.auth.register}`, () => {
        it('[HTTP-AUTH-REG-004] returns forbidden when registration is disabled via config', async () => {
            const previous = config.enableRegistration;
            config.enableRegistration = false;

            try {
                const res = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);

                expect(res.status).toBe(403);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.FORBIDDEN_ERROR);
                expect(typeof res.body.timestamp).toBe('string');
            } finally {
                config.enableRegistration = previous;
            }
        });

        it('[HTTP-AUTH-REG-001] returns access token and refresh cookie on successful registration', async () => {
            const res = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expectValidAccessToken(res.body.data, mockEmail);
            expect(typeof res.body.meta.timestamp).toBe('number');
            expectRefreshTokenCookieContract(res.headers['set-cookie']);
        });

        it('[HTTP-AUTH-REG-002] returns conflict when the email is already registered', async () => {
            const conflictPayload = mapToRegisterPayload('conflict-register@example.com');
            const first = await agent.post(constants.routes.auth.register).send(conflictPayload);
            expect(first.status).toBe(200);

            const second = await agent.post(constants.routes.auth.register).send(conflictPayload);

            expect(second.status).toBe(409);
            expect(second.body.success).toBe(false);
            expect(second.body.code).toBe(ErrorCode.CONFLICT_ERROR);
            expect(typeof second.body.timestamp).toBe('string');
        });

        describe('[HTTP-AUTH-REG-003] — invalid body', () => {
            it('returns validation error when the email is not valid', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    email: 'invalid-email',
                });
                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
                expect(Array.isArray(res.body.issues)).toBe(true);
                expect(typeof res.body.timestamp).toBe('string');
            });

            it('returns validation error when there is no email', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    email: undefined,
                });
                expect(res.status).toBe(400);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
            });

            it('returns validation error when the password is not valid', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    password: 'short',
                    confirmationPassword: 'short',
                });
                expect(res.status).toBe(400);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
            });

            it('returns validation error when there is no password', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    password: undefined,
                });
                expect(res.status).toBe(400);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
            });

            it('returns validation error when confirmation password does not match', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    confirmationPassword: `${INTEGRATION_AUTH_PASSWORD}X`,
                });
                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
                expect(res.body.issues).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            property: 'confirmationPassword',
                            message: 'Passwords do not match',
                        }),
                    ])
                );
            });

            it('returns validation error when there is no confirmation password', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    confirmationPassword: undefined,
                });
                expect(res.status).toBe(400);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
            });

            it('returns validation error when the first name is missing', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    firstName: undefined,
                });
                expect(res.status).toBe(400);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
            });

            it('returns validation error when the last name is missing', async () => {
                const res = await agent.post(constants.routes.auth.register).send({
                    ...mockRegisterPayload,
                    lastName: undefined,
                });
                expect(res.status).toBe(400);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
            });
        });
    });

    describe(`POST ${constants.routes.auth.login}`, () => {
        it('[HTTP-AUTH-LOG-001] returns access token and refresh cookie on successful login', async () => {
            await agent.post(constants.routes.auth.register).send(mockRegisterPayload);
            const res = await agent.post(constants.routes.auth.login).send({
                email: mockEmail,
                password: INTEGRATION_AUTH_PASSWORD,
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expectValidAccessToken(res.body.data, mockEmail);
            expect(typeof res.body.meta.timestamp).toBe('number');
            expectRefreshTokenCookieContract(res.headers['set-cookie']);
        });

        describe('[HTTP-AUTH-LOG-002] — invalid credentials (identical failure shape)', () => {
            it('fails when the password is wrong', async () => {
                await agent.post(constants.routes.auth.register).send(mockRegisterPayload);

                const res = await agent.post(constants.routes.auth.login).send({
                    email: mockEmail,
                    password: `${INTEGRATION_AUTH_PASSWORD}X`,
                });

                expect(res.status).toBe(404);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.NOT_FOUND_ERROR);
                expect(typeof res.body.timestamp).toBe('string');
            });

            it('fails when the email is wrong', async () => {
                await agent.post(constants.routes.auth.register).send(mockRegisterPayload);
                const res = await agent.post(constants.routes.auth.login).send({
                    email: `x${mockEmail}`,
                    password: INTEGRATION_AUTH_PASSWORD,
                });

                expect(res.status).toBe(404);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.NOT_FOUND_ERROR);
            });

            it('fails when the user does not exist', async () => {
                const res = await agent.post(constants.routes.auth.login).send({
                    email: mockEmail,
                    password: INTEGRATION_AUTH_PASSWORD,
                });

                expect(res.status).toBe(404);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.NOT_FOUND_ERROR);
            });
        });
    });

    describe(`POST ${constants.routes.auth.logout}`, () => {
        it('[HTTP-AUTH-OUT-001] rejects logout without the refresh cookie', async () => {
            const res = await agent.post(constants.routes.auth.logout);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
            expect(typeof res.body.timestamp).toBe('string');
        });

        it('[AUTH-OUT-002] returns a success response on successful logout', async () => {
            const registerResponse = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);
            const setCookie = registerResponse.headers['set-cookie'];
            const logoutResponse = await agent.post(constants.routes.auth.logout).set('Cookie', setCookie);

            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body.success).toBe(true);
            expect(logoutResponse.body.data).toBeUndefined();
            expect(typeof logoutResponse.body.meta.timestamp).toBe('number');
            expectRefreshTokenClearCookie(logoutResponse.headers['set-cookie']);
        });

        it('[HTTP-AUTH-OUT-003] rejects refresh after logout', async () => {
            const registerResponse = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);
            const setCookie = registerResponse.headers['set-cookie'];

            const logoutResponse = await agent.post(constants.routes.auth.logout).set('Cookie', setCookie);
            expect(logoutResponse.status).toBe(200);

            const afterLogout = await agent.get(constants.routes.auth.refresh);
            expect(afterLogout.status).toBe(401);
            expect(afterLogout.body.success).toBe(false);
            expect(afterLogout.body.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
        });
    });

    describe(`GET ${constants.routes.auth.refresh}`, () => {
        it('[HTTP-AUTH-REF-001] issues a new access token when the refresh cookie is valid', async () => {
            const registerResponse = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);
            const setCookie = registerResponse.headers['set-cookie'];
            const firstAccess = registerResponse.body.data;

            // JWT `iat` is second-resolution; refresh in the same second can mint an identical access string.
            await new Promise<void>(resolve => {
                setTimeout(resolve, 1100);
            });

            const refreshResponse = await agent.get(constants.routes.auth.refresh).set('Cookie', setCookie);

            expect(refreshResponse.status).toBe(200);
            expect(refreshResponse.body.success).toBe(true);
            expectValidAccessToken(refreshResponse.body.data, mockEmail);
            expect(refreshResponse.body.data).not.toBe(firstAccess);
            expect(typeof refreshResponse.body.meta.timestamp).toBe('number');
        });

        it('[HTTP-AUTH-REF-002] rejects refresh without the cookie', async () => {
            const refreshResponse = await agent.get(constants.routes.auth.refresh);

            expect(refreshResponse.status).toBe(401);
            expect(refreshResponse.body.success).toBe(false);
            expect(refreshResponse.body.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
            expect(typeof refreshResponse.body.timestamp).toBe('string');
        });

        describe('[HTTP-AUTH-REF-003] — invalid refresh credential', () => {
            it('rejects refresh when the cookie is not a valid JWT', async () => {
                const cookieName = constants.http.cookies.refreshToken;
                const res = await agent.get(constants.routes.auth.refresh).set('Cookie', `${cookieName}=not-a-jwt`);

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
            });

            it('rejects refresh when the cookie holds an access token', async () => {
                const registerResponse = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);
                const accessToken = registerResponse.body.data as string;
                const cookieName = constants.http.cookies.refreshToken;

                const res = await agent
                    .get(constants.routes.auth.refresh)
                    .set('Cookie', `${cookieName}=${accessToken}`);

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
            });
        });
    });

    describe('Session tokens — [HTTP-AUTH-TOK-*]', () => {
        it('[HTTP-AUTH-TOK-001] puts the access token only in the JSON body on register success', async () => {
            const res = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expectValidAccessToken(res.body.data, mockEmail);
            expect(typeof res.body.meta.timestamp).toBe('number');
            expect(JSON.stringify(res.body)).not.toMatch(/refreshToken/);
        });

        it('[HTTP-AUTH-TOK-002] sets the refresh token only as an httpOnly cookie on register success', async () => {
            const res = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);

            expect(res.status).toBe(200);
            expectRefreshTokenCookieContract(res.headers['set-cookie']);
            expect(JSON.stringify(res.body)).not.toMatch(/refreshToken/);
        });

        describe('[HTTP-AUTH-TOK-003] — protected route without a usable access token', () => {
            it('rejects a protected jobs route when Authorization is missing', async () => {
                const res = await agent.get(constants.routes.jobs.getAll);

                // Wire today: InputValidationException → 400 VALIDATION_ERROR (doc wants 401).
                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
                expect(typeof res.body.timestamp).toBe('string');
            });

            it('rejects a protected jobs route when the Bearer token is invalid', async () => {
                const res = await agent
                    .get(constants.routes.jobs.getAll)
                    .set('Authorization', 'Bearer not-a-valid-jwt');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
                expect(typeof res.body.timestamp).toBe('string');
            });
        });
    });
});
