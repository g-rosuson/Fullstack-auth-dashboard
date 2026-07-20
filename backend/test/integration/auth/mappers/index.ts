import { INTEGRATION_AUTH_PASSWORD } from '../constants';

/**
 * Builds a register-request body for integration tests.
 *
 * @param email - Email address for the new user
 * @returns Payload accepted by the auth register route validator
 */
function mapToRegisterPayload(email: string): {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmationPassword: string;
} {
    return {
        firstName: 'John',
        lastName: 'Doe',
        email,
        password: INTEGRATION_AUTH_PASSWORD,
        confirmationPassword: INTEGRATION_AUTH_PASSWORD,
    };
}

export { mapToRegisterPayload };
