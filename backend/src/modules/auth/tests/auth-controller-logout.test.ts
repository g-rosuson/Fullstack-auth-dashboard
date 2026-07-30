import { logout } from '../auth-controller';

import constants from 'shared/constants';

import { HttpStatusCode } from 'shared/enums/http-status-codes';

import type { Request, Response } from 'express';

/**
 * Verification: unit proofs for logout HTTP scenarios (cite HTTP IDs; FRs via HTTP Traces).
 * @see docs/specs/architecture/http/auth/logout.md
 */

const mockGetRefreshCookieOptions = vi.fn();
const mockResponseStatus = vi.fn();
const mockResponseJson = vi.fn();
const mockResponseClearCookie = vi.fn();

const mockResponse = {
    status: mockResponseStatus,
    json: mockResponseJson,
    clearCookie: mockResponseClearCookie,
} as unknown as Response;

const now = 1_710_072_000_000;
const clearCookieOptions = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };

vi.mock('../utils', () => ({
    default: {
        getRefreshCookieOptions: (...args: unknown[]) => mockGetRefreshCookieOptions(...args),
    },
}));

describe('auth-controller logout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        mockResponseStatus.mockReturnValue(mockResponse);
        mockGetRefreshCookieOptions.mockReturnValue(clearCookieOptions);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('[HTTP-AUTH-OUT-002]', () => {
        it('clears the refresh cookie and returns success without data', async () => {
            await logout({} as Request, mockResponse);

            expect(mockGetRefreshCookieOptions).toHaveBeenCalledWith(false);
            expect(mockResponseClearCookie).toHaveBeenCalledWith(
                constants.http.cookies.refreshToken,
                clearCookieOptions
            );
            expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
            expect(mockResponseJson).toHaveBeenCalledWith({
                success: true,
                meta: { timestamp: now },
            });
            expect(mockResponseJson.mock.calls[0][0].data).toBeUndefined();
        });
    });
});
