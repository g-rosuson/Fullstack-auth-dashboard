import { CookieOptions } from 'express';

import config from 'config';

import { TokenExpiration } from 'shared/enums/jwt';

/**
 * Returns Express cookie options for the httpOnly refresh token.
 *
 * Used for `res.cookie` on login/register and `res.clearCookie` on logout — both
 * calls must pass the same shape (aside from `maxAge`) or the browser will not
 * clear the cookie.
 *
 * **Localhost / E2E:** When `config.domain` is `localhost`, the `Domain` attribute
 * is omitted so the cookie is host-only. Explicit `Domain=localhost` is mishandled
 * by some browsers (notably WebKit on Linux CI): the cookie may not be stored or
 * sent on later cross-port requests from the Vite dev server (`:5173`) to the API
 * (`:3000`), breaking logout, reload, and protected routes in Playwright. Host-only
 * cookies are the recommended pattern for local development and do not affect prod.
 *
 * **Production:** `PROD_DOMAIN` is set on the cookie as today (`secure: true`,
 * `sameSite: 'strict'`).
 *
 * @param includeMaxAge Whether to include the maxAge property (false for clearCookie)
 */
const getRefreshCookieOptions = (includeMaxAge = true): CookieOptions => {
    const options: CookieOptions = {
        httpOnly: true,
        secure: !config.isDeveloping,
        sameSite: 'strict',
        path: '/',
        ...(includeMaxAge && {
            maxAge: TokenExpiration.Refresh * 1000,
        }),
    };

    // Omit Domain for localhost — see JSDoc above. Prod keeps PROD_DOMAIN.
    if (config.domain !== 'localhost') {
        options.domain = config.domain;
    }

    return options;
};

const utils = {
    getRefreshCookieOptions,
};

export default utils;
