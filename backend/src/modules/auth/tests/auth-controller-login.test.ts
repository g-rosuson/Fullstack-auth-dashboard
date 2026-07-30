import { UnauthorizedException } from 'aop/exceptions';

import { login } from '../auth-controller';

import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { LoginUserInput } from '../types';
import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for login HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see docs/specs/architecture/http/auth/login.md
 * @see docs/specs/architecture/http/auth/session.md
 */

const mockGetByEmail = vi.fn();
const mockCreateTokens = vi.fn();
const mockGetRefreshCookieOptions = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();
const mockResponseCookie = vi.fn();
const mockBcryptCompare = vi.fn();

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
    cookie: mockResponseCookie,
} as unknown as Response;

const now = 1_710_072_000_000;
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };

const userDocument = {
    _id: { toString: () => 'user-id-1' },
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
};

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn(),
        compare: (...args: unknown[]) => mockBcryptCompare(...args),
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

const buildRequest = (body: LoginUserInput): Request =>
    ({
        body,
        context: {
            db: {
                repository: {
                    users: {
                        getByEmail: mockGetByEmail,
                    },
                },
            },
        },
    }) as unknown as Request;

describe('auth-controller login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockCreateTokens.mockReturnValue({ accessToken: 'access-jwt', refreshToken: 'refresh-jwt' });
        mockGetRefreshCookieOptions.mockReturnValue(cookieOptions);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('[HTTP-AUTH-LOG-001]', () => {
        it('returns an access token and sets the refresh cookie for valid credentials', async () => {
            mockGetByEmail.mockResolvedValue(userDocument);
            mockBcryptCompare.mockResolvedValue(true);

            await login(buildRequest({ email: userDocument.email, password: 'SecureP@ss1' }), mockResponse);

            expect(mockGetByEmail).toHaveBeenCalledWith(userDocument.email);
            expect(mockBcryptCompare).toHaveBeenCalledWith('SecureP@ss1', userDocument.password);
            expect(mockCreateTokens).toHaveBeenCalledWith({
                firstName: userDocument.firstName,
                lastName: userDocument.lastName,
                email: userDocument.email,
                id: 'user-id-1',
            });
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
        });
    });

    describe('[HTTP-AUTH-LOG-002]', () => {
        it('rejects with UnauthorizedException when the email is unknown', async () => {
            mockGetByEmail.mockResolvedValue(null);

            await expect(
                login(buildRequest({ email: 'missing@example.com', password: 'SecureP@ss1' }), mockResponse)
            ).rejects.toMatchObject({
                message: ErrorMessage.USER_NOT_FOUND,
            });
            await expect(
                login(buildRequest({ email: 'missing@example.com', password: 'SecureP@ss1' }), mockResponse)
            ).rejects.toBeInstanceOf(UnauthorizedException);

            expect(mockBcryptCompare).not.toHaveBeenCalled();
            expect(mockCreateTokens).not.toHaveBeenCalled();
            expect(mockResponseCookie).not.toHaveBeenCalled();
        });

        it('rejects with UnauthorizedException when the password is wrong', async () => {
            mockGetByEmail.mockResolvedValue(userDocument);
            mockBcryptCompare.mockResolvedValue(false);

            await expect(
                login(buildRequest({ email: userDocument.email, password: 'WrongP@ss1' }), mockResponse)
            ).rejects.toMatchObject({
                message: ErrorMessage.USER_PASSWORD_WRONG,
            });
            await expect(
                login(buildRequest({ email: userDocument.email, password: 'WrongP@ss1' }), mockResponse)
            ).rejects.toBeInstanceOf(UnauthorizedException);

            expect(mockCreateTokens).not.toHaveBeenCalled();
            expect(mockResponseCookie).not.toHaveBeenCalled();
        });
    });
});
