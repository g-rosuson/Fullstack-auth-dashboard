import { Request, Response } from 'express';

import { ForbiddenException } from 'aop/exceptions/errors/authentication';

import { validateAuthenticationInput } from './auth-middleware';

import config from 'config';
import constants from 'shared/constants';

describe('validateAuthenticationInput middleware', () => {
    const originalEnableRegistration = config.enableRegistration;

    afterEach(() => {
        config.enableRegistration = originalEnableRegistration;
    });

    it('[AUTH-REG-011] throws ForbiddenException on register route when enableRegistration is false', () => {
        config.enableRegistration = false;
        const mockNext = vi.fn();
        const response = {} as unknown as Response;
        const request = {
            path: constants.routes.auth.register,
            body: {},
        } as Request;

        expect(() => validateAuthenticationInput(request, response, mockNext)).toThrow(ForbiddenException);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next on register route when enableRegistration is true', () => {
        config.enableRegistration = true;
        const mockNext = vi.fn();
        const response = {} as unknown as Response;
        const request = {
            path: constants.routes.auth.register,
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'SecureP@ss1',
                confirmationPassword: 'SecureP@ss1',
            },
        } as Request;

        validateAuthenticationInput(request, response, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
