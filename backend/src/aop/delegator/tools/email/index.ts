import type { OnTargetFinish } from '../../tools/types';
import type { EmailTool } from 'shared/types/jobs/tools/types-tools-email';

/**
 * Email tool handler for executing email job operations.
 */
class Email {
    /**
     * Executes the email tool for given targets.
     * Accepts `signal` for registry uniformity; cancel behavior TBD when implemented.
     */
    async execute({
        tool,
        signal,
        onTargetFinish,
    }: {
        tool: EmailTool;
        signal: AbortSignal;
        onTargetFinish: OnTargetFinish;
    }) {
        console.log(tool, signal, onTargetFinish);
    }
}

export default Email;
