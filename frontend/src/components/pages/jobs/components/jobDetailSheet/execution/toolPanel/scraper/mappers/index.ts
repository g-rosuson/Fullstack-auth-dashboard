import { ScraperTargetRow } from '../types/Scraper.types';

import { ExecutionScraperToolTargetResult } from '@/_types/_gen';

/**
 * Maps a single result item to a table row, resolving the title from whichever
 * listing shape is present (error or success).
 */
const mapToRow = (result: ExecutionScraperToolTargetResult): ScraperTargetRow => {
    const url = result.listing.url?.trim() ? result.listing.url : 'n/a';
    const reasonCodes = result.screen?.reasonCodes ?? [];
    const passed = result.screen?.passed ?? false;
    let title = 'n/a';

    if ('error' in result.listing) {
        title = result.listing.error.message;
    } else {
        title = result.listing.title;
    }

    return { title, url, reasonCodes, passed };
};

const mappers = { mapToRow };

export default mappers;
