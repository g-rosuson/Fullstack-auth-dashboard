import { logger } from 'aop/logging';

import scraperConstants from '../../constants';
import constants from './constants';

import type {
    ScraperDescriptionSection,
    ScraperInformationItem,
    ScraperTarget,
    ScraperTargetConfig,
} from '../../types';
import type { SemanticSearchResponse } from './types';
import type { Page } from 'playwright';
import type { ExecutionScraperToolTargetListing } from 'shared/types/jobs/tools/execution/types-execution-scraper-tool';

import helpers from '../../helpers';
import { chromium } from 'playwright';
import { retryWithFixedInterval } from 'utils/async/utils-async-retry';

/**
 * Fetch one page of vacancy IDs from the jobs.ch semantic search API.
 */
async function fetchSemanticSearchPage(
    page: Page,
    query: string,
    pageIndex: number,
    scraperTargetConfig: ScraperTargetConfig
): Promise<SemanticSearchResponse> {
    const params = new URLSearchParams({
        query,
        rows: constants.configuration.semanticSearchRows.toString(),
        page: pageIndex.toString(),
    });
    const url = `${constants.configuration.semanticSearchApiUrl}?${params.toString()}`;

    return retryWithFixedInterval(
        async () => {
            const response = await page.request.get(url, {
                headers: {
                    Accept: 'application/json',
                    Origin: constants.configuration.siteOrigin,
                    Referer: `${constants.configuration.siteOrigin}/`,
                },
            });

            if (!response.ok()) {
                throw new Error(`Semantic search request failed with status ${response.status()}`);
            }

            return response.json() as Promise<SemanticSearchResponse>;
        },
        {
            maxAttempts: scraperTargetConfig.totalAttempts,
            delayMs: scraperTargetConfig.retryDelayMs,
            operationName: 'fetch semantic search page',
        }
    );
}

/**
 * Extract the trimmed text content of the title element.
 */
async function extractTitle(page: Page): Promise<string> {
    const text = await page.textContent(constants.selectors.titleSelector).catch(() => null);
    return text?.trim() ?? '';
}

/**
 * Extract structured description sections from the jobs.ch detail page.
 *
 * jobs.ch markup uses alternating section titles (in `p > strong`) and content
 * blocks (paragraphs or list items). The first direct child of the description
 * container is a CTA box ("You are a great fit for this position.") which we
 * skip.
 */
async function extractDescriptions(page: Page): Promise<ScraperDescriptionSection[]> {
    const container = page.locator(constants.selectors.descriptionSelector);

    if ((await container.count()) === 0) {
        return [];
    }

    return container.evaluate((containerElement, selectors) => {
        const sections: { title?: string; blocks: string[] }[] = [];
        let current: { title?: string; blocks: string[] } | null = null;

        const children = Array.from(containerElement.children);
        let firstChildSkipped = false;

        for (const child of children) {
            // Skip the first child (CTA box).
            if (!firstChildSkipped) {
                firstChildSkipped = true;
                continue;
            }

            const spans = Array.from(child.querySelectorAll(selectors.allSpans));

            for (const span of spans) {
                const text = span.textContent?.trim();
                if (!text) {
                    continue;
                }

                /**
                 * Section title: a span whose closest ancestor is `p > strong`.
                 * Finalize the previous section before starting a new one.
                 */
                if (span.closest(selectors.titleContainer)) {
                    if (current && current.blocks.length > 0) {
                        sections.push(current);
                    }
                    current = { title: text, blocks: [] };
                    continue;
                }

                const parentParagraph = span.closest(selectors.paragraph);
                const parentListItem = span.closest(selectors.listItem);

                /**
                 * Plain paragraph (not a title): a `<p>` that doesn't contain a `<strong>`.
                 */
                if (parentParagraph && !parentParagraph.querySelector(selectors.strong)) {
                    if (!current) {
                        current = { blocks: [] };
                    }
                    current.blocks.push(text);
                } else if (parentListItem) {
                    if (!current) {
                        current = { blocks: [] };
                    }
                    current.blocks.push(text);
                }
            }
        }

        if (current && current.blocks.length > 0) {
            sections.push(current);
        }

        return sections;
    }, constants.selectors.descriptionParsing);
}

/**
 * Extract a list of label/value information items from the info block.
 *
 * Each list item has 2 text spans — the first is the label, the second the
 * value. SVG-only spans (icons) are filtered out.
 */
async function extractInformations(page: Page): Promise<ScraperInformationItem[]> {
    const container = page.locator(constants.selectors.infoSelector);

    if ((await container.count()) === 0) {
        return [];
    }

    return container.evaluate((containerElement, selectors) => {
        const items: ScraperInformationItem[] = [];

        const list = containerElement.querySelector(selectors.list);
        if (!list) {
            return items;
        }

        const listItems = Array.from(list.querySelectorAll(selectors.listItem));

        for (const listItem of listItems) {
            const spans = Array.from(listItem.querySelectorAll(selectors.span));
            const texts: string[] = [];

            for (const span of spans) {
                const hasSvg = span.querySelector(selectors.svg) !== null;
                if (hasSvg) {
                    continue;
                }

                const text = span.textContent?.trim();
                if (text) {
                    texts.push(text);
                }
            }

            if (texts.length >= 2) {
                items.push({ label: texts[0], value: texts[1] as string });
            } else if (texts.length === 1) {
                items.push({ label: '', value: texts[0] as string });
            }
        }

        return items;
    }, constants.selectors.informationParsing);
}

/**
 * Extract the company name from the detail page.
 *
 * Handles two markup variants:
 * 1. With link: an anchor `[data-cy="company-link"]` contains a span with the name.
 * 2. Without link: a `[data-cy="vacancy-logo"]` div contains a span with the name
 *    (filtered against an SVG logo span).
 */
async function extractCompanyName(page: Page): Promise<ScraperInformationItem | null> {
    const parsing = constants.selectors.companyNameParsing;

    const companyLink = await page.$(constants.selectors.companyNameSelector);
    if (companyLink) {
        const value = await companyLink.evaluate((element, spanSelector) => {
            const span = element.querySelector(spanSelector);
            return span?.textContent?.trim() ?? null;
        }, parsing.span);

        if (value) {
            return { label: parsing.label, value };
        }
    }

    const vacancyLogo = await page.$(constants.selectors.vacancyLogoSelector);
    if (vacancyLogo) {
        const value = await vacancyLogo.evaluate(
            (element, args) => {
                const spans = Array.from(element.querySelectorAll(args.span)) as HTMLSpanElement[];
                for (const span of spans) {
                    const hasSvg = span.querySelector(args.svg) !== null;
                    if (hasSvg) {
                        continue;
                    }
                    const text = span.textContent?.trim();
                    if (text) {
                        return text;
                    }
                }
                return null;
            },
            { span: parsing.span, svg: parsing.svg }
        );

        if (value) {
            return { label: parsing.label, value };
        }
    }

    return null;
}

/**
 * Scrape a single jobs.ch detail page into an execution listing payload.
 */
async function scrapeDetailListing(page: Page, url: string): Promise<ExecutionScraperToolTargetListing> {
    await page.waitForSelector(constants.selectors.titleSelector);

    const title = await extractTitle(page);
    const descriptions = await extractDescriptions(page);
    const informations = await extractInformations(page);

    const company = await extractCompanyName(page);
    informations.push({ label: 'Company', value: company?.value ?? '' });

    const text = helpers.formatListingBodyFromSections(
        descriptions,
        informations,
        scraperConstants.listing.maxListingTextLength
    );
    const fields = helpers.informationsToFields(informations);

    return {
        ok: true,
        source: 'jobs-ch',
        url,
        title,
        text,
        fields,
    };
}

/**
 * jobs.ch target.
 *
 * Strategy: paginate the semantic search API for vacancy IDs, then scrape each detail page sequentially.
 */
const jobsChTarget: ScraperTarget = {
    async run(scraperTargetConfig: ScraperTargetConfig): Promise<ExecutionScraperToolTargetListing[]> {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        try {
            /**
             * Collect vacancy detail URLs via the semantic search API.
             *
             * DOM pagination in headless Playwright stops around ~100 results; the API exposes the full result set.
             */
            const query = scraperTargetConfig.keywords.join(' ');
            const jobDetailUrlSet = new Set<string>();
            let currentPageIndex = 1;

            while (scraperTargetConfig.maxPages === 0 || currentPageIndex <= scraperTargetConfig.maxPages) {
                const searchPage = await fetchSemanticSearchPage(page, query, currentPageIndex, scraperTargetConfig);

                for (const document of searchPage.documents) {
                    jobDetailUrlSet.add(`${constants.configuration.detailUrlPrefix}${document.id}`);
                }

                if (searchPage.documents.length === 0 || currentPageIndex >= searchPage.numPages) {
                    break;
                }

                currentPageIndex += 1;
            }

            /**
             * Scrape each detail page sequentially on one tab.
             */
            const listings: ExecutionScraperToolTargetListing[] = [];

            for (const url of jobDetailUrlSet) {
                try {
                    await retryWithFixedInterval(
                        async () => {
                            await page.goto(url);
                        },
                        {
                            maxAttempts: scraperTargetConfig.totalAttempts,
                            delayMs: scraperTargetConfig.retryDelayMs,
                            operationName: 'navigate to job detail page',
                        }
                    );
                } catch (error) {
                    listings.push({
                        ok: false,
                        source: 'jobs-ch',
                        url,
                        error: {
                            code: 'NAVIGATION_FAILED',
                            message: `Failed to navigate to job detail page: ${url}`,
                        },
                    });
                    continue;
                }

                /**
                 * Scrape the job detail page and append a listing snapshot or structured failure.
                 */
                try {
                    listings.push(await scrapeDetailListing(page, url));
                } catch (error) {
                    logger.error('Failed to scrape job detail page', { error: error as Error });
                    listings.push({
                        ok: false,
                        source: 'jobs-ch',
                        url,
                        error: {
                            code: 'SCRAPE_FAILED',
                            message: 'Failed to scrape job detail page',
                        },
                    });
                }
            }

            return listings;
        } catch (error) {
            logger.error('jobs-ch target failed', { error: error as Error });

            return [
                {
                    ok: false,
                    source: 'jobs-ch',
                    url: '',
                    error: {
                        code: 'TARGET_FAILED',
                        message: 'Failed to scrape jobs.ch',
                    },
                },
            ];
        } finally {
            await page.close().catch(error => logger.error('Error closing chrome page', { error }));
            await browser.close().catch(error => logger.error('Error closing chrome browser', { error }));
        }
    },
};

export default jobsChTarget;
