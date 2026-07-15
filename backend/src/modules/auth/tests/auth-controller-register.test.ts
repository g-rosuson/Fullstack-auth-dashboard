import { register } from '../auth-controller';

import constants from 'shared/constants';

import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { RegisterUserInput } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for register HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/auth/registration.md
 * @see documentation/architecture/http/auth/session.md
 */

const mockCreate = vi.fn();
const mockCreateTokens = vi.fn();
const mockGetRefreshCookieOptions = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();
const mockResponseCookie = vi.fn();
const mockBcryptHash = vi.fn();

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
    cookie: mockResponseCookie,
} as unknown as Response;

const now = 1_710_072_000_000;
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };

vi.mock('bcrypt', () => ({
    default: {
        hash: (...args: unknown[]) => mockBcryptHash(...args),
        compare: vi.fn(),
    },
}));

vi.mock('services/jwt', () => ({
    default: {
        createTokens: (...args: unknown[]) => mockCreateTokens(...args),
    },
}));

vi.mock('../utils', () => ({
    default: {
        getRefreshCookieOptions: (...args: unknown[]) => mockGetRefreshCookieOptions(...args),
    },
}));

const buildRequestBody = (): RegisterUserInput => ({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'SecureP@ss1',
    confirmationPassword: 'SecureP@ss1',
});

const buildRequest = (body: RegisterUserInput): Request =>
    ({
        body,
        context: {
            db: {
                repository: {
                    users: {
                        create: mockCreate,
                    },
                },
            },
        },
    }) as unknown as Request;

describe('auth-controller register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockBcryptHash.mockResolvedValue('hashed-password');
        mockCreate.mockResolvedValue({ insertedId: { toString: () => 'user-id-1' } });
        mockCreateTokens.mockReturnValue({ accessToken: 'access-jwt', refreshToken: 'refresh-jwt' });
        mockGetRefreshCookieOptions.mockReturnValue(cookieOptions);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('[HTTP-AUTH-REG-001]', () => {
        it('creates the user, returns an access token, and sets the refresh cookie', async () => {
            const body = buildRequestBody();
            const request = buildRequest(body);

            await register(request, mockResponse);

            expect(mockBcryptHash).toHaveBeenCalledWith(body.password, 10);
            expect(mockCreate).toHaveBeenCalledWith({
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                password: 'hashed-password',
            });
            expect(mockCreateTokens).toHaveBeenCalledWith({
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                id: 'user-id-1',
            });
            expect(mockGetRefreshCookieOptions).toHaveBeenCalledWith();
            expect(mockResponseCookie).toHaveBeenCalledWith(
                constants.http.cookies.refreshToken,
                'refresh-jwt',
                cookieOptions
            );
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: 'access-jwt',
                meta: { timestamp: now },
            });
            expect(JSON.stringify(mockResponseJson.mock.calls[0][0])).not.toMatch(/refresh/);
        });
    });

    describe('[HTTP-AUTH-TOK-001]', () => {
        it('puts the access token only in the JSON body', async () => {
            await register(buildRequest(buildRequestBody()), mockResponse);

            expect(mockResponseJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: 'access-jwt',
                })
            );
        });
    });

    describe('[HTTP-AUTH-TOK-002]', () => {
        it('sets the refresh token only as a cookie', async () => {
            await register(buildRequest(buildRequestBody()), mockResponse);

            expect(mockResponseCookie).toHaveBeenCalledWith(
                constants.http.cookies.refreshToken,
                'refresh-jwt',
                cookieOptions
            );
            expect(JSON.stringify(mockResponseJson.mock.calls[0][0])).not.toMatch(/refresh/);
        });
    });
});
