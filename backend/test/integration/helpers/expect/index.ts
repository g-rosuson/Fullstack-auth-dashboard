/**
 * Shared HTTP response-envelope assertions for integration tests.
 *
 * Contract: docs/specs/architecture/http/README.md — datetimes are ISO-8601 UTC
 * strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
 */

/** Matches `Date.prototype.toISOString()` (UTC, millisecond precision). */
const ISO_8601_UTC_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type SuccessEnvelopeBody = {
    success?: boolean;
    meta?: { timestamp?: unknown };
};

type ErrorEnvelopeBody = {
    success?: boolean;
    code?: string;
    timestamp?: unknown;
};

/**
 * Asserts a value is an ISO-8601 UTC timestamp string with millisecond precision.
 */
function expectIso8601UtcTimestamp(value: unknown): void {
    expect(typeof value).toBe('string');
    expect(value).toMatch(ISO_8601_UTC_MS);
}

/**
 * Asserts a success JSON body: `success: true` and `meta.timestamp` as ISO-8601 UTC.
 */
function expectSuccessEnvelope(body: SuccessEnvelopeBody): void {
    expect(body.success).toBe(true);
    expect(body.meta).toEqual(
        expect.objectContaining({
            timestamp: expect.any(String),
        })
    );
    expectIso8601UtcTimestamp(body.meta?.timestamp);
}

/**
 * Asserts an error JSON body: `success: false`, optional `code`, and top-level ISO-8601 `timestamp`.
 */
function expectErrorEnvelope(body: ErrorEnvelopeBody, code?: string): void {
    expect(body.success).toBe(false);
    if (code !== undefined) {
        expect(body.code).toBe(code);
    } else {
        expect(typeof body.code).toBe('string');
    }
    expectIso8601UtcTimestamp(body.timestamp);
}

export { expectErrorEnvelope, expectIso8601UtcTimestamp, expectSuccessEnvelope };
