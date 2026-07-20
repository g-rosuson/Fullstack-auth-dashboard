import { ErrorCode } from 'aop/exceptions/shared/enums';

/**
 * Polls while an immediate (no-schedule) create is still executing tools.
 */
async function expectBusinessLogicBlockWhilePossiblyRunning(
    attempt: () => Promise<{ status: number; body: { success?: boolean; code?: string } }>
): Promise<void> {
    let sawBusinessBlock = false;

    for (let i = 0; i < 80; i++) {
        const res = await attempt();
        if (res.status === 422 && res.body.code === ErrorCode.BUSINESS_LOGIC_ERROR) {
            sawBusinessBlock = true;
            expect(res.body.success).toBe(false);
            break;
        }
        await new Promise<void>(resolve => {
            setTimeout(resolve, 50);
        });
    }

    expect(sawBusinessBlock).toBe(true);
}

export { expectBusinessLogicBlockWhilePossiblyRunning };
