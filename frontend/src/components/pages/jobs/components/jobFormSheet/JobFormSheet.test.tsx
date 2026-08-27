import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { ComponentProps } from 'react';

import JobFormSheet from './JobFormSheet';
import { JobScheduleType } from '@/_types/_gen';
import { buildJob } from '@/components/pages/jobs/jobs.test.fixtures';

/**
 * Renders an open job form sheet with sensible defaults.
 */
const renderSheet = (props: Partial<ComponentProps<typeof JobFormSheet>> = {}) => {
    const onOpenChange = props.onOpenChange ?? vi.fn();
    const onCreateJob = props.onCreateJob ?? vi.fn(async () => undefined);
    const onUpdateJob = props.onUpdateJob ?? vi.fn(async () => undefined);

    return render(
        <JobFormSheet
            job={props.job ?? null}
            isRunning={props.isRunning ?? false}
            isOpen={props.isOpen ?? true}
            isSubmitting={props.isSubmitting ?? false}
            onOpenChange={onOpenChange}
            onCreateJob={onCreateJob}
            onUpdateJob={onUpdateJob}
        />
    );
};

describe('JobFormSheet: create fields', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-JOBS-CRT-001] shows name, tools, schedule, and submit', () => {
        renderSheet();

        const sheet = screen.getByRole('dialog', { name: 'Create job' });
        expect(within(sheet).getByLabelText(/Name/i)).toBeInTheDocument();
        expect(within(sheet).getByText('Tools')).toBeInTheDocument();
        expect(within(sheet).getByRole('button', { name: 'Add target' })).toBeInTheDocument();
        expect(within(sheet).getByText('Schedule')).toBeInTheDocument();
        expect(within(sheet).getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-CRT-003] blocks submit when the name is empty', async () => {
        const onCreateJob = vi.fn(async () => undefined);
        renderSheet({ onCreateJob });

        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(onCreateJob).not.toHaveBeenCalled();
        expect(screen.getByLabelText(/Name/i)).toBeInvalid();
        expect(screen.getByRole('dialog', { name: 'Create job' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-UPD-003] blocks submit when the edit name is cleared', async () => {
        const onUpdateJob = vi.fn(async () => undefined);
        renderSheet({ job: buildJob(), onUpdateJob });

        const name = screen.getByLabelText(/Name/i);
        await userEvent.clear(name);
        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

        expect(onUpdateJob).not.toHaveBeenCalled();
        expect(name).toBeInvalid();
        expect(screen.getByRole('dialog', { name: 'Edit job' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-UPD-004] still opens edit with tools listed so they can be removed', () => {
        renderSheet({ job: buildJob() });

        const sheet = screen.getByRole('dialog', { name: 'Edit job' });
        expect(within(sheet).getByText('scraper')).toBeInTheDocument();
        expect(within(sheet).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
});

describe('JobFormSheet: schedule field visibility', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-JOBS-SCH-006] offers once, daily, weekly, monthly, and yearly', () => {
        renderSheet();

        const type = screen.getByLabelText('Type');
        expect(within(type).getByRole('option', { name: 'Once' })).toBeInTheDocument();
        expect(within(type).getByRole('option', { name: 'Daily' })).toBeInTheDocument();
        expect(within(type).getByRole('option', { name: 'Weekly' })).toBeInTheDocument();
        expect(within(type).getByRole('option', { name: 'Monthly' })).toBeInTheDocument();
        expect(within(type).getByRole('option', { name: 'Yearly' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-SCH-002] hides end date and end time when the type is once', async () => {
        renderSheet();

        expect(screen.getByRole('button', { name: /End date/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/End time/i)).toBeInTheDocument();

        await userEvent.selectOptions(screen.getByLabelText('Type'), JobScheduleType.once);

        expect(screen.queryByRole('button', { name: /End date/i })).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/End time/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start date/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Start time/i)).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-SCH-001] requires start date and time when a schedule type is selected', async () => {
        const onCreateJob = vi.fn(async () => undefined);
        renderSheet({ onCreateJob });

        await userEvent.type(screen.getByLabelText(/Name/i), 'Alpha');
        await userEvent.selectOptions(screen.getByLabelText('Type'), JobScheduleType.daily);
        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(onCreateJob).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'Create job' })).toBeInTheDocument();
    });

    it('[CLIENT-JOBS-TLR-001] opens the add-tool flow with a tool-type choice', async () => {
        renderSheet();

        await userEvent.click(screen.getByRole('button', { name: 'Add target' }));

        const dialog = await screen.findByRole('dialog', { name: 'Add tool' });
        const toolType = within(dialog).getByLabelText('Tool type');
        expect(within(toolType).getByRole('option', { name: 'Scraper' })).toBeInTheDocument();
        expect(within(toolType).getByRole('option', { name: 'Email' })).toBeInTheDocument();
    });
});
