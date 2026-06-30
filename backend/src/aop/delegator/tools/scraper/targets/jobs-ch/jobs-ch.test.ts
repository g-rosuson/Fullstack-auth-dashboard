import { beforeEach, describe, expect, it, vi } from 'vitest';

import constants from './constants';

import type { ScraperDescriptionSection, ScraperInformationItem, ScraperTargetConfig } from '../../types';
import type { SemanticSearchResponse } from './types';
import type { Locator, Page } from 'playwright';

import jobsChTarget from './index';
import { chromium } from 'playwright';
import { retryWithFixedInterval } from 'utils/async/utils-async-retry';

vi.mock('utils/async/utils-async-retry', () => ({
    retryWithFixedInterval: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock('playwright', () => ({
    chromium: {
        launch: vi.fn(),
    },
}));

/**
 * Default {@link ScraperTargetConfig} for jobs-ch target tests.
 */
function buildTargetConfig(overrides?: Partial<ScraperTargetConfig>): ScraperTargetConfig {
    return {
        targetId: 't',
        target: 'jobs-ch',
        keywords: ['frontend'],
        maxPages: 1,
        totalAttempts: 3,
        retryDelayMs: 1000,
        ...overrides,
    };
}

/**
 * Stub `page.request.get` to return paginated semantic-search JSON in call order.
 */
function mockSemanticSearchResponse(pages: SemanticSearchResponse[]) {
    let callIndex = 0;

    return vi.fn(async (url: string) => {
        const page = pages[callIndex] ?? {
            documents: [],
            numPages: pages.length,
            currentPage: callIndex + 1,
            totalHits: 0,
            rows: 20,
        };
        callIndex += 1;

        return {
            ok: () => true,
            json: async () => page,
            status: () => 200,
            url,
        };
    });
}

/**
 * Options for {@link buildPage}.
 */
type BuildPageOptions = {
    /** Title text returned from `textContent(titleSelector)`. */
    title?: string | null;
    /** When `0`, the description container is treated as absent. */
    descriptionCount?: number;
    /** Pre-built sections returned from `descriptionSelector.evaluate`. */
    descriptions?: ScraperDescriptionSection[];
    /** When `0`, the info container is treated as absent. */
    infoCount?: number;
    /** Pre-built rows returned from `infoSelector.evaluate`. */
    informations?: ScraperInformationItem[];
    /** Company name from `[data-cy="company-link"]`. Omit when absent. */
    companyLink?: string;
    /** Company name from `[data-cy="vacancy-logo"]` when no company link is set. */
    vacancyLogo?: string;
    /** Paginated API payloads consumed by the default `request.get` stub. */
    semanticSearchPages?: SemanticSearchResponse[];
    /** Custom `page.request.get` stub; overrides `semanticSearchPages`. */
    apiGet?: ReturnType<typeof vi.fn>;
    /** Custom `page.goto` stub. */
    goto?: ReturnType<typeof vi.fn>;
    /** Custom `page.waitForSelector` stub. */
    waitForSelector?: ReturnType<typeof vi.fn>;
};

/**
 * Resolve locator `count()` — explicit override, else 1 when content is provided, else 0.
 */
function containerCount(explicit: number | undefined, hasContent: boolean): number {
    if (explicit !== undefined) {
        return explicit;
    }
    return hasContent ? 1 : 0;
}

/**
 * Build a fake Playwright {@link Page} wired to jobs.ch selectors.
 *
 * Each call to `locator(selector)` returns a stub matched to the extraction
 * phase (description, info). Company extraction uses `$` + `evaluate` stubs
 * that return pre-built parser results.
 */
const buildPage = (options: BuildPageOptions): Page => {
    const absentLocator = { count: vi.fn().mockResolvedValue(0), evaluate: vi.fn() };

    const descLocator: Locator = {
        count: vi.fn().mockResolvedValue(containerCount(options.descriptionCount, options.descriptions !== undefined)),
        evaluate: vi.fn().mockResolvedValue(options.descriptions ?? []),
    } as unknown as Locator;

    const infoLocator: Locator = {
        count: vi.fn().mockResolvedValue(containerCount(options.infoCount, options.informations !== undefined)),
        evaluate: vi.fn().mockResolvedValue(options.informations ?? []),
    } as unknown as Locator;

    const companyLinkElement = options.companyLink
        ? { evaluate: vi.fn().mockResolvedValue(options.companyLink) }
        : null;

    const vacancyLogoElement =
        options.vacancyLogo && !options.companyLink
            ? { evaluate: vi.fn().mockResolvedValue(options.vacancyLogo) }
            : null;

    const locatorBySelector: Record<string, Locator> = {
        [constants.selectors.descriptionSelector]: descLocator,
        [constants.selectors.infoSelector]: infoLocator,
    };

    const elementBySelector: Record<string, typeof companyLinkElement> = {
        [constants.selectors.companyNameSelector]: companyLinkElement,
        [constants.selectors.vacancyLogoSelector]: vacancyLogoElement,
    };

    const page = {
        goto: options.goto ?? vi.fn().mockResolvedValue(undefined),
        request: {
            get: options.apiGet ?? mockSemanticSearchResponse(options.semanticSearchPages ?? []),
        },
        locator: vi.fn().mockImplementation((selector: string) => locatorBySelector[selector] ?? absentLocator),
        textContent: vi.fn().mockResolvedValue(options.title ?? 'Engineer'),
        waitForSelector: options.waitForSelector ?? vi.fn().mockResolvedValue(undefined),
        $: vi.fn().mockImplementation((selector: string) => Promise.resolve(elementBySelector[selector] ?? null)),
        close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    return page;
};

/**
 * Mock `chromium.launch`, run {@link jobsChTarget}, and return results plus a
 * `browserClose` spy for lifecycle assertions.
 */
async function runTarget(page: Page, overrides?: Partial<ScraperTargetConfig>) {
    const browserClose = vi.fn().mockResolvedValue(undefined);
    vi.mocked(chromium.launch).mockResolvedValue({
        newPage: vi.fn().mockResolvedValue(page),
        close: browserClose,
    } as never);

    const results = await jobsChTarget.run(buildTargetConfig(overrides));
    return { results, browserClose };
}

describe('jobsChTarget — semantic search discovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('joins keywords with spaces in the API query', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 },
        ]);
        const page = buildPage({
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
            apiGet,
        });
        await runTarget(page, { keywords: ['react', 'frontend'], maxPages: 1 });

        expect(apiGet).toHaveBeenCalledWith(
            expect.stringContaining('query=react+frontend'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Accept: 'application/json',
                    Origin: 'https://www.jobs.ch',
                    Referer: 'https://www.jobs.ch/',
                }),
            })
        );
    });

    it('uses fixed rows and page index on the first API call', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page, { maxPages: 1 });

        expect(apiGet).toHaveBeenCalledWith(
            'https://job-search-api.jobs.ch/search/semantic?query=frontend&rows=20&page=1',
            expect.any(Object)
        );
    });

    it('fetches only one API page when maxPages is 1', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'a' }], numPages: 5, currentPage: 1, totalHits: 5, rows: 20 },
            { documents: [{ id: 'b' }], numPages: 5, currentPage: 2, totalHits: 5, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page, { maxPages: 1 });

        expect(apiGet).toHaveBeenCalledTimes(1);
    });

    it('fetches all pages when maxPages is 0', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'a' }], numPages: 3, currentPage: 1, totalHits: 3, rows: 20 },
            { documents: [{ id: 'b' }], numPages: 3, currentPage: 2, totalHits: 3, rows: 20 },
            { documents: [{ id: 'c' }], numPages: 3, currentPage: 3, totalHits: 3, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page, { maxPages: 0 });

        expect(apiGet).toHaveBeenCalledTimes(3);
    });

    it('stops when a page returns empty documents', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'a' }], numPages: 5, currentPage: 1, totalHits: 5, rows: 20 },
            { documents: [], numPages: 5, currentPage: 2, totalHits: 5, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        const { results } = await runTarget(page, { maxPages: 0 });

        expect(apiGet).toHaveBeenCalledTimes(2);
        expect(results).toHaveLength(1);
    });

    it('does not request beyond numPages', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'a' }], numPages: 2, currentPage: 1, totalHits: 2, rows: 20 },
            { documents: [{ id: 'b' }], numPages: 2, currentPage: 2, totalHits: 2, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page, { maxPages: 0 });

        expect(apiGet).toHaveBeenCalledTimes(2);
        expect(apiGet).not.toHaveBeenCalledWith(expect.stringContaining('page=3'), expect.any(Object));
    });

    it('maps document ids to detail URLs', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'abc' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        const { results } = await runTarget(page, { maxPages: 1 });

        expect(page.goto).toHaveBeenCalledWith('https://www.jobs.ch/en/vacancies/detail/abc');
        expect(results[0]).toMatchObject({ ok: true, url: 'https://www.jobs.ch/en/vacancies/detail/abc' });
    });

    it('deduplicates ids across API pages', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'dup' }, { id: 'one' }], numPages: 2, currentPage: 1, totalHits: 2, rows: 20 },
            { documents: [{ id: 'dup' }, { id: 'two' }], numPages: 2, currentPage: 2, totalHits: 2, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page, { maxPages: 2 });

        expect(page.goto).toHaveBeenCalledTimes(3);
    });

    it('returns an empty array when the first API page has no documents', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [], numPages: 1, currentPage: 1, totalHits: 0, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        const { results } = await runTarget(page);

        expect(results).toEqual([]);
        expect(page.goto).not.toHaveBeenCalled();
    });

    it('retries the API call totalAttempts times before failing', async () => {
        vi.mocked(retryWithFixedInterval).mockImplementation(async (fn, options) => {
            let lastError: Error | undefined;
            for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
                try {
                    return (await fn()) as never;
                } catch (error) {
                    lastError = error as Error;
                }
            }
            throw lastError;
        });

        const apiGet = vi.fn(async () => ({
            ok: () => false,
            status: () => 500,
            json: async () => ({}),
        }));

        const page = buildPage({ apiGet });
        const { results } = await runTarget(page, { totalAttempts: 3 });

        expect(apiGet).toHaveBeenCalledTimes(3);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            ok: false,
            source: 'jobs-ch',
            url: '',
            error: { code: 'TARGET_FAILED' },
        });
    });

    it('fetches maxPages API pages even when numPages is higher', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'p1' }], numPages: 5, currentPage: 1, totalHits: 5, rows: 20 },
            { documents: [{ id: 'p2' }], numPages: 5, currentPage: 2, totalHits: 5, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page, { maxPages: 2 });

        expect(apiGet).toHaveBeenCalledTimes(2);
        expect(page.goto).toHaveBeenCalledTimes(2);
    });

    it('deduplicates duplicate ids on the same API page', async () => {
        const apiGet = mockSemanticSearchResponse([
            { documents: [{ id: 'dup' }, { id: 'dup' }], numPages: 1, currentPage: 1, totalHits: 2, rows: 20 },
        ]);
        const page = buildPage({ apiGet });
        await runTarget(page);

        expect(page.goto).toHaveBeenCalledTimes(1);
    });
});

describe('jobsChTarget — detail scrape assembly', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('trims whitespace from the title', async () => {
        const title = '  Senior Engineer  ';
        const page = buildPage({
            title,
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        const { results } = await runTarget(page);

        expect(results[0]).toMatchObject({ ok: true, title: title.trim() });
    });

    it('returns an empty title when textContent is null', async () => {
        const page = buildPage({
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        vi.mocked(page.textContent).mockRejectedValue(new Error('missing'));

        const { results } = await runTarget(page);
        expect(results[0]).toMatchObject({ ok: true, title: '' });
    });

    it('waits for the title selector before extraction', async () => {
        const waitForSelector = vi.fn().mockResolvedValue(undefined);
        const page = buildPage({
            waitForSelector,
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        await runTarget(page);

        expect(waitForSelector).toHaveBeenCalledWith(constants.selectors.titleSelector);
    });

    it('assembles a successful listing with text and fields', async () => {
        const page = buildPage({
            descriptions: [{ title: 'Tasks', blocks: ['Build features'] }],
            informations: [{ label: 'Location', value: 'Zurich' }],
            companyLink: 'Acme AG',
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        const { results } = await runTarget(page);

        expect(results[0]).toMatchObject({
            ok: true,
            source: 'jobs-ch',
            url: 'https://www.jobs.ch/en/vacancies/detail/a',
            title: 'Engineer',
            fields: {
                Location: 'Zurich',
                Company: 'Acme AG',
            },
        });
        expect((results[0] as { ok: true; text: string }).text).toContain('Tasks');
        expect((results[0] as { ok: true; text: string }).text).toContain('Build features');
        expect((results[0] as { ok: true; text: string }).text).toContain('Location: Zurich');
        expect((results[0] as { ok: true; text: string }).text).toContain('Company: Acme AG');
    });

    it('appends Company with empty value when no company element is found', async () => {
        const page = buildPage({
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        const { results } = await runTarget(page);

        expect(results[0]).toMatchObject({
            ok: true,
            fields: { Company: '' },
        });
    });

    it('uses vacancy logo when company link is absent', async () => {
        const page = buildPage({
            vacancyLogo: 'Logo Corp',
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        const { results } = await runTarget(page);

        expect(results[0]).toMatchObject({
            ok: true,
            fields: { Company: 'Logo Corp' },
        });
    });

    it('returns ok listing with empty text when all extraction containers are absent', async () => {
        const page = buildPage({
            descriptionCount: 0,
            infoCount: 0,
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        const { results } = await runTarget(page);

        expect(results[0]).toMatchObject({
            ok: true,
            title: 'Engineer',
            text: 'Company: ',
            fields: { Company: '' },
        });
    });

    it('produces one listing per discovered URL', async () => {
        const page = buildPage({
            semanticSearchPages: [
                {
                    documents: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
                    numPages: 1,
                    currentPage: 1,
                    totalHits: 3,
                    rows: 20,
                },
            ],
        });
        const { results } = await runTarget(page);

        expect(page.goto).toHaveBeenCalledTimes(3);
        expect(results).toHaveLength(3);
        expect(results.every(r => r.ok)).toBe(true);
    });
});

describe('jobsChTarget — error handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(retryWithFixedInterval).mockImplementation(async (fn: () => Promise<unknown>) => fn());
    });

    it('records NAVIGATION_FAILED and continues scraping remaining URLs', async () => {
        const goto = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(undefined);
        const page = buildPage({
            goto,
            semanticSearchPages: [
                {
                    documents: [{ id: 'fail' }, { id: 'ok' }],
                    numPages: 1,
                    currentPage: 1,
                    totalHits: 2,
                    rows: 20,
                },
            ],
        });

        vi.mocked(retryWithFixedInterval).mockImplementation(async (fn, options) => {
            let lastError: Error | undefined;
            for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
                try {
                    return (await fn()) as never;
                } catch (error) {
                    lastError = error as Error;
                }
            }
            throw lastError;
        });

        const { results } = await runTarget(page, { totalAttempts: 1 });

        expect(results).toHaveLength(2);
        expect(results[0]).toMatchObject({
            ok: false,
            url: 'https://www.jobs.ch/en/vacancies/detail/fail',
            error: { code: 'NAVIGATION_FAILED' },
        });
        expect(results[1]).toMatchObject({ ok: true });
    });

    it('records SCRAPE_FAILED when detail extraction throws', async () => {
        const waitForSelector = vi.fn().mockRejectedValue(new Error('timeout'));
        const page = buildPage({
            waitForSelector,
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        const { results } = await runTarget(page);

        expect(results[0]).toMatchObject({
            ok: false,
            error: { code: 'SCRAPE_FAILED' },
        });
    });

    it('returns mixed results for nav fail, scrape fail, and success', async () => {
        const urls = [
            'https://www.jobs.ch/en/vacancies/detail/nav-fail',
            'https://www.jobs.ch/en/vacancies/detail/scrape-fail',
            'https://www.jobs.ch/en/vacancies/detail/ok',
        ];
        let gotoCount = 0;
        const goto = vi.fn().mockImplementation(async (url: string) => {
            gotoCount += 1;
            if (url.includes('nav-fail')) {
                throw new Error('nav');
            }
        });

        let scrapeAttempts = 0;
        const waitForSelector = vi.fn().mockImplementation(async () => {
            scrapeAttempts += 1;
            if (scrapeAttempts === 1) {
                throw new Error('scrape');
            }
        });

        const page = buildPage({
            goto,
            waitForSelector,
            semanticSearchPages: [
                {
                    documents: [{ id: 'nav-fail' }, { id: 'scrape-fail' }, { id: 'ok' }],
                    numPages: 1,
                    currentPage: 1,
                    totalHits: 3,
                    rows: 20,
                },
            ],
        });

        vi.mocked(retryWithFixedInterval).mockImplementation(async (fn, options) => {
            let lastError: Error | undefined;
            for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
                try {
                    return (await fn()) as never;
                } catch (error) {
                    lastError = error as Error;
                }
            }
            throw lastError;
        });

        const { results } = await runTarget(page, { totalAttempts: 1 });

        expect(gotoCount).toBe(3);
        expect(results).toHaveLength(3);
        expect(results.filter(r => !r.ok).map(r => (r as { error: { code: string } }).error.code)).toEqual([
            'NAVIGATION_FAILED',
            'SCRAPE_FAILED',
        ]);
        expect(results[2]).toMatchObject({ ok: true, url: urls[2] });
    });

    it('propagates when browser launch throws', async () => {
        vi.mocked(chromium.launch).mockRejectedValue(new Error('launch failed'));
        await expect(jobsChTarget.run(buildTargetConfig())).rejects.toThrow('launch failed');
    });

    it('always closes the browser and page', async () => {
        const pageClose = vi.fn().mockResolvedValue(undefined);
        const browserClose = vi.fn().mockResolvedValue(undefined);
        const page = buildPage({
            semanticSearchPages: [{ documents: [{ id: 'a' }], numPages: 1, currentPage: 1, totalHits: 1, rows: 20 }],
        });
        page.close = pageClose;

        vi.mocked(chromium.launch).mockResolvedValue({
            newPage: vi.fn().mockResolvedValue(page),
            close: browserClose,
        } as never);

        await jobsChTarget.run(buildTargetConfig());

        expect(pageClose).toHaveBeenCalled();
        expect(browserClose).toHaveBeenCalled();
    });
});
