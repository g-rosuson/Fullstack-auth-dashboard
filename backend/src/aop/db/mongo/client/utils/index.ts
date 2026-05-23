import type { IndexKeySpec } from '../../shared/types';

/**
 * Builds an explicit index name from key spec following MongoDB's pattern (e.g. `email_1`, `userId_1_name_1`).
 */
function buildIndexName(indexKeys: IndexKeySpec): string {
    return Object.entries(indexKeys)
        .map(([field, order]) => `${field}_${order}`)
        .join('_');
}

const utils = {
    buildIndexName,
};

export default utils;
