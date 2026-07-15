import config from 'config';

import { TokenExpiration } from 'shared/enums/jwt';

import utils from './index';

/**
 * Verification: refresh cookie option contract (cite NFR IDs).
 * @see documentation/requirements/nfr/security/authentication.md
 */

describe('auth utils getRefreshCookieOptions', () => {
    const originalIsDeveloping = config.isDeveloping;
    const originalDomain = config.domain;

    afterEach(() => {
        config.isDeveloping = originalIsDeveloping;
        config.domain = originalDomain;
    });

    describe('[NFR-SEC-AUTH-003]', () => {
        it('sets HttpOnly, SameSite=Strict, Path=/, and Secure outside development', () => {
            config.isDeveloping = false;
            config.domain = 'example.com';

            expect(utils.getRefreshCookieOptions()).toEqual({
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/',
                maxAge: TokenExpiration.Refresh * 1000,
                domain: 'example.com',
            });
        });

        it('omits Secure in development', () => {
            config.isDeveloping = true;
            config.domain = 'example.com';

            expect(utils.getRefreshCookieOptions().secure).toBe(false);
        });

        it('omits Domain when the host is localhost', () => {
            config.isDeveloping = true;
            config.domain = 'localhost';

            expect(utils.getRefreshCookieOptions()).not.toHaveProperty('domain');
        });

        it('omits maxAge when clearing the cookie', () => {
            config.isDeveloping = false;
            config.domain = 'example.com';

            expect(utils.getRefreshCookieOptions(false)).not.toHaveProperty('maxAge');
        });
    });
});
