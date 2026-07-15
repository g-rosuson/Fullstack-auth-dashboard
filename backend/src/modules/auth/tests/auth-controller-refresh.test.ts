import { verify } from 'jsonwebtoken';

import { TokenException } from 'aop/exceptions';

import { renewAccessToken } from '../auth-controller';

import constants from 'shared/constants';

import { ErrorMessage } from 'shared/enums/error-messages';
import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for refresh HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see documentation/architecture/http/auth/refresh.md
 * @see documentation/architecture/http/auth/session.md
 */

const mockCreateTokens = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();
const mockVerify = vi.mocked(verify);

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
} as unknown as Response;

const now = 1_710_072_000_000;

const validPayload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    id: 'user-id-1',
};

vi.mock('jsonwebtoken', () => ({
    verify: vi.fn(),
}));

vi.mock('services/jwt', () => ({
    default: {
        createTokens: (...args: unknown[]) => mockCreateTokens(...args),
    },
}));

vi.mock('config', () => ({
    default: {
        refreshTokenSecret: 'refresh-secret',
        accessTokenSecret: 'access-secret',
        isDeveloping: false,
        domain: 'example.com',
    },
}));

const buildRequest = (refreshToken: string): Request =>
    ({
        cookies: {
            [constants.http.cookies.refreshToken]: refreshToken,
        },
    }) as unknown as Request;

describe('auth-controller renewAccessToken', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockCreateTokens.mockReturnValue({ accessToken: 'new-access-jwt', refreshToken: 'unused' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('[HTTP-AUTH-REF-001]', () => {
        it('returns a new access token when the refresh cookie JWT is valid', async () => {
            mockVerify.mockReturnValue(validPayload as never);

            await renewAccessToken(buildRequest('refresh-jwt'), mockResponse);

            expect(mockVerify).toHaveBeenCalledWith('refresh-jwt', 'refresh-secret');
            expect(mockCreateTokens).toHaveBeenCalledWith(validPayload);
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                data: 'new-access-jwt',
                meta: { timestamp: now },
            });
        });
    });

    describe('[HTTP-AUTH-REF-003]', () => {
        it('rejects when refresh claims are malformed', async () => {
            mockVerify.mockReturnValue({ email: 'not-enough-claims' } as never);

            await expect(renewAccessToken(buildRequest('refresh-jwt'), mockResponse)).rejects.toBeInstanceOf(
                TokenException
            );
            await expect(renewAccessToken(buildRequest('refresh-jwt'), mockResponse)).rejects.toMatchObject({
                message: ErrorMessage.TOKEN_INVALID,
            });

            expect(mockCreateTokens).not.toHaveBeenCalled();
            expect(mockResponseJson).not.toHaveBeenCalled();
        });
    });

    describe('[HTTP-AUTH-TOK-001]', () => {
        it('puts the renewed access token only in the JSON body', async () => {
            mockVerify.mockReturnValue(validPayload as never);

            await renewAccessToken(buildRequest('refresh-jwt'), mockResponse);

            expect(mockResponseJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: 'new-access-jwt',
                })
            );
            expect(JSON.stringify(mockResponseJson.mock.calls[0][0])).not.toMatch(/refresh/);
        });
    });
});
