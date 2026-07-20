import jwt from 'jsonwebtoken';

import config from 'config';
import constants from 'shared/constants';

/**
 * Normalizes `Set-Cookie` into separate cookie attribute strings for assertions.
 */
function parseSetCookieLines(setCookieHeader: string | string[] | undefined): string[] {
    return Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
}

/**
 * Verifies an access JWT with the application access-token secret and asserts payload shape (`email`, `iat`, `exp`).
 *
 * @param token - Access token string from a JSON response body
 * @param email - Expected `email` claim after verification
 */
function expectValidAccessToken(token: string, email: string): void {
    const payload = jwt.verify(token, config.accessTokenSecret);

    expect(payload).toEqual(
        expect.objectContaining({
            email,
            iat: expect.any(Number),
            exp: expect.any(Number),
        })
    );
}

/**
 * Asserts the refresh-token `Set-Cookie` matches the wire contract (httpOnly, SameSite=Strict, Path=/, Secure when not developing).
 *
 * @param setCookieHeader - `Set-Cookie` header(s) from the HTTP response
 */
function expectRefreshTokenCookieContract(setCookieHeader: string | string[] | undefined): void {
    const lines = parseSetCookieLines(setCookieHeader);
    const name = constants.http.cookies.refreshToken;
    const refreshLine = lines.find(line => line.startsWith(`${name}=`));

    expect(refreshLine).toBeDefined();
    const lower = refreshLine!.toLowerCase();
    expect(lower).toContain('httponly');
    expect(refreshLine).toMatch(/samesite=strict/i);
    expect(refreshLine).toMatch(/path=\//i);

    if (config.isDeveloping) {
        expect(lower).not.toContain('secure');
    } else {
        expect(lower).toContain('secure');
    }
}

/**
 * Asserts logout returned a `Set-Cookie` that clears the refresh cookie (epoch expiry or `max-age=0`).
 *
 * @param setCookieHeader - `Set-Cookie` header(s) from the logout response
 */
function expectRefreshTokenClearCookie(setCookieHeader: string | string[] | undefined): void {
    const lines = parseSetCookieLines(setCookieHeader);
    const name = constants.http.cookies.refreshToken;
    const clearLine = lines.find(line => line.startsWith(`${name}=`));

    expect(clearLine).toBeDefined();
    expect(clearLine).toMatch(/expires=thu,\s*01\s+jan\s+1970|expires=wed,\s*31\s+dec\s+1969|max-age=0/i);
}

export { expectValidAccessToken, expectRefreshTokenCookieContract, expectRefreshTokenClearCookie };
