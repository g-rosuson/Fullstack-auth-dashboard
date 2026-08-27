import { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, type Mock } from 'vitest';

import constants from './constants';
import Jobs from './Jobs';
import { buildJob } from './jobs.test.fixtures';
import {
    AggregatedJobsEventType,
    JobCancelledEventType,
    JobFailedEventType,
    JobFinishedEventType,
    JobTargetFinishedEventType,
} from '@/_types/_gen';
import api from '@/api';
import { CustomError } from '@/services/error';

const mockToastAdd = vi.hoisted(() => vi.fn());
const stream = vi.hoisted(() => ({
    close: vi.fn(),
    on: {} as Partial<Record<string, (_payload: unknown) => void>>,
}));

vi.mock('@/api', () => ({
    default: {
        service: {
            resources: {
                jobs: {
                    getAll: vi.fn(),
                    create: vi.fn(),
                    update: vi.fn(),
                    streamAll: vi.fn(options => {
                        stream.on = options.on;
                        return { close: stream.close };
                    }),
                },
            },
        },
    },
}));

vi.mock('@/components/blocks/toast/Toast', async importOriginal => {
    const actual = await importOriginal<typeof import('@/components/blocks/toast/Toast')>();

    return {
        ...actual,
        toast: {
            add: mockToastAdd,
            close: actual.toast.close,
            update: actual.toast.update,
            promise: actual.toast.promise,
        },
    };
});

vi.mock('@/services/logging', () => ({
    default: {
        error: vi.fn(),
        warning: vi.fn(),
    },
}));

/**
 * Renders the jobs page after the list request resolves.
 */
const renderJobs = async (jobs: ReturnType<typeof buildJob>[] = []) => {
    (api.service.resources.jobs.getAll as Mock).mockResolvedValue({ data: jobs });
    const view = render(<Jobs />);
    await waitFor(() => {
        expect(document.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
    });
    return view;
};

/**
 * Fills the add-tool dialog with a valid scraper tool and saves it onto the sheet.
 */
const addScraperTool = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }));

    const dialog = await screen.findByRole('dialog', { name: 'Add tool' });

    await userEvent.selectOptions(within(dialog).getByLabelText('Tool type'), 'scraper');
    await userEvent.type(within(dialog).getByLabelText(/Max pages/i), '1');
    await userEvent.type(within(dialog).getByPlaceholderText('Enter a keyword...'), 'react{enter}');
    await userEvent.selectOptions(within(dialog).getByLabelText('Target'), 'jobs-ch');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add tool' }));

    await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Add tool' })).not.toBeInTheDocument();
    });
};

describe('Jobs page: views', () => {
    afterEach(() => {
        vi.clearAllMocks();
        stream.on = {};
    });

    it('[CLIENT-JOBS-LST-001] shows a loading indicator and hides the list create control', () => {
        (api.service.resources.jobs.getAll as Mock).mockReturnValue(new Promise(() => {}));

        render(<Jobs />);

        expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Create job' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Jobs', level: 1 })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-LST-002] shows the empty placeholder with a create control and no list create control', async () => {
        await renderJobs([]);

        expect(
            screen.getByText('No jobs exist yet, create your first job to get started.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create job' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-LST-002] opens the create flow from the placeholder', async () => {
        await renderJobs([]);

        await userEvent.click(screen.getByRole('button', { name: 'Create job' }));

        const sheet = await screen.findByRole('dialog', { name: 'Create job' });
        expect(within(sheet).getByLabelText(/Name/i)).toBeInTheDocument();
        expect(within(sheet).getByRole('button', { name: 'Add target' })).toBeInTheDocument();
        expect(within(sheet).getByLabelText('Type')).toBeInTheDocument();
        expect(within(sheet).getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-CRT-001] create flow shows name, tools, schedule, and submit', async () => {
        await renderJobs([]);

        await userEvent.click(screen.getByRole('button', { name: 'Create job' }));

        const sheet = await screen.findByRole('dialog', { name: 'Create job' });
        expect(within(sheet).getByLabelText(/Name/i)).toBeInTheDocument();
        expect(within(sheet).getByText('Tools')).toBeInTheDocument();
        expect(within(sheet).getByText('Schedule')).toBeInTheDocument();
        expect(within(sheet).getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });
});

describe('Jobs page: create validation and toasts', () => {
    afterEach(() => {
        vi.clearAllMocks();
        stream.on = {};
    });

    it('[CLIENT-JOBS-CRT-004] / [CLIENT-JOBS-NTF-002] empty tools stay on create with an error toast', async () => {
        await renderJobs([]);
        (api.service.resources.jobs.create as Mock).mockRejectedValue(new CustomError('Invalid request body'));

        await userEvent.click(screen.getByRole('button', { name: 'Create job' }));
        await userEvent.type(screen.getByLabelText(/Name/i), 'Alpha');
        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockToastAdd).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    description: 'Invalid request body',
                })
            );
        });
        expect(screen.getByRole('dialog', { name: 'Create job' })).toBeInTheDocument();
        expect(api.service.resources.jobs.create).toHaveBeenCalled();
    });

    it('[CLIENT-JOBS-NTF-001] shows a success toast after create and lists the job', async () => {
        const created = buildJob({ name: 'Alpha' });
        await renderJobs([]);
        (api.service.resources.jobs.create as Mock).mockResolvedValue({ data: created });

        await userEvent.click(screen.getByRole('button', { name: 'Create job' }));
        await userEvent.type(screen.getByLabelText(/Name/i), 'Alpha');
        await addScraperTool();
        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockToastAdd).toHaveBeenCalledWith({
                type: 'success',
                title: 'Alpha',
                description: constants.label.toast.created,
            });
        });
        expect(screen.queryByRole('dialog', { name: 'Create job' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Alpha', level: 2 })).toBeInTheDocument();
    });
});

describe('Jobs page: stream toasts', () => {
    afterEach(() => {
        vi.clearAllMocks();
        stream.on = {};
    });

    it('[CLIENT-JOBS-NTF-003] toasts when a target finishes', async () => {
        await renderJobs([buildJob()]);

        act(() => {
            stream.on['job-target-finished']?.({
                type: JobTargetFinishedEventType['job-target-finished'],
                jobId: 'job-1',
                userId: 'user-1',
                executionId: 'exec-1',
                schedule: { delegatedAt: '2024-06-01T10:00:00.000Z', finishedAt: null, type: 'once' },
                tool: {
                    type: 'scraper',
                    toolId: 'tool-1',
                    targets: [],
                },
                target: {
                    target: 'jobs-ch',
                    targetId: 'target-1',
                    results: [],
                    summary: { total: 0, passed: 0, rejected: 0, reasonCounts: {} },
                },
            });
        });

        await waitFor(() => {
            expect(mockToastAdd).toHaveBeenCalledWith({
                type: 'info',
                title: 'Alpha',
                description: constants.label.toast.targetFinished,
            });
        });
    });

    it('[CLIENT-JOBS-NTF-003] toasts when a run finishes', async () => {
        await renderJobs([buildJob()]);

        act(() => {
            stream.on['job-finished']?.({
                type: JobFinishedEventType['job-finished'],
                jobId: 'job-1',
                userId: 'user-1',
                executionId: 'exec-1',
                finishedAt: '2024-06-01T10:05:00.000Z',
            });
        });

        await waitFor(() => {
            expect(mockToastAdd).toHaveBeenCalledWith({
                type: 'success',
                title: 'Alpha',
                description: constants.label.toast.jobFinished,
            });
        });
    });

    it('[CLIENT-JOBS-NTF-003] toasts when a run fails', async () => {
        await renderJobs([buildJob()]);

        act(() => {
            stream.on['job-failed']?.({
                type: JobFailedEventType['job-failed'],
                jobId: 'job-1',
                userId: 'user-1',
                executionId: 'exec-1',
                failedAt: '2024-06-01T10:05:00.000Z',
            });
        });

        await waitFor(() => {
            expect(mockToastAdd).toHaveBeenCalledWith({
                type: 'error',
                title: 'Alpha',
                description: constants.label.toast.jobFailed,
            });
        });
    });

    it('[CLIENT-JOBS-NTF-003] toasts when a run is cancelled', async () => {
        await renderJobs([buildJob()]);

        act(() => {
            stream.on['job-cancelled']?.({
                type: JobCancelledEventType['job-cancelled'],
                jobId: 'job-1',
                userId: 'user-1',
                executionId: 'exec-1',
                cancelledAt: '2024-06-01T10:05:00.000Z',
            });
        });

        await waitFor(() => {
            expect(mockToastAdd).toHaveBeenCalledWith({
                type: 'warning',
                title: 'Alpha',
                description: constants.label.toast.jobCancelled,
            });
        });
    });

    it('[CLIENT-JOBS-STR-002] hydrates running state from the aggregated snapshot without reload', async () => {
        await renderJobs([buildJob()]);

        act(() => {
            stream.on['jobs-aggregated']?.({
                type: AggregatedJobsEventType['jobs-aggregated'],
                userId: 'user-1',
                runningJobs: [{ jobId: 'job-1', emittedEvents: [] }],
                scheduledJobs: [],
            });
        });

        await waitFor(() => {
            expect(screen.getByText('Running')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
        });
    });
});
