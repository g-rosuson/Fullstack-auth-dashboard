# Backend Test Patterns

Canonical examples for backend integration and unit tests.

---

## Integration Test Structure

```typescript
// backend/test/integration/auth/auth.integration.test.ts

import { clearCollections, deleteCronJobs, disconnectMongo, getAgent, initServer } from '../harness';
import { buildRegisterPayload, expectValidAccessToken, expectRefreshTokenCookieContract } from './helpers';
import constants from 'shared/constants';
import type { Express } from 'express';

const mockEmail = 'email@example.com';
const mockRegisterPayload = buildRegisterPayload(mockEmail);

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
        it('[FR-AUTH-REG-001] returns access token and refresh cookie on success', async () => {
            const res = await agent.post(constants.routes.auth.register).send(mockRegisterPayload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expectValidAccessToken(res.body.data, mockEmail);
            expectRefreshTokenCookieContract(res.headers['set-cookie']);
        });

        it('[FR-AUTH-REG-002] returns conflict when email already registered', async () => {
            const payload = buildRegisterPayload('conflict@example.com');

            const first = await agent.post(constants.routes.auth.register).send(payload);
            expect(first.status).toBe(200);

            const second = await agent.post(constants.routes.auth.register).send(payload);
            expect(second.status).toBe(409);
            expect(second.body.success).toBe(false);
        });
    });
});
```

Rules:
- `beforeAll`: start server once per `describe` block.
- `beforeEach`: clear collections + cron jobs.
- `afterAll`: clear + disconnect.
- Tag spec-backed tests with exactly one FR/NFR/requirement ID (e.g. `[FR-AUTH-REG-001]`). Do not combine IDs; one case per `it`.
- Assert HTTP contract only (status, `body.success`, shape). Not internal state.
- Use `describe.sequential` when test cases share DB state across `it` blocks.

---

## Integration Test Config

```javascript
// backend/vitest.integration.config.mjs

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        include: ['test/integration/**/*.test.ts'],
        testTimeout: 60_000,
        hookTimeout: 60_000,
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } },
        fileParallelism: false,
        sequence: { concurrent: false },
    },
});
```

Run: `npm run test:integration` inside `backend/`. Requires Docker MongoDB running.

---

## Unit Test (Utility)

```typescript
// backend/src/lib/validation/validation.test.ts
import { z } from 'zod';
import { parseSchema } from './index';

const schema = z.object({ name: z.string() });

describe('parseSchema', () => {
    it('returns success and data for valid input', () => {
        const result = parseSchema(schema, { name: 'Alice' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.name).toBe('Alice');
    });

    it('returns failure with issues for invalid input', () => {
        const result = parseSchema(schema, { name: 123 });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.issues.length).toBeGreaterThan(0);
    });
});
```

Vitest globals (`describe`, `it`, `expect`) are enabled — no need to import them.

---

## Shared Property Names Across Schema, Input, and Expectation

Reuse the same variables for keys and values so schema, payload, and assertion stay aligned:

```typescript
it('should validate user data', () => {
    const nameProperty = 'name';
    const emailProperty = 'email';
    const nameValue = 'John';
    const emailValue = 'john@example.com';

    const schema = z.object({
        [nameProperty]: z.string(),
        [emailProperty]: z.string().email(),
    });

    const result = parseSchema(schema, {
        [nameProperty]: nameValue,
        [emailProperty]: emailValue,
    });

    expect(result).toEqual({
        success: true,
        data: { [nameProperty]: nameValue, [emailProperty]: emailValue },
    });
});
```
