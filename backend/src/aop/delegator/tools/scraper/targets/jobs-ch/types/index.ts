/**
 * A semantic search document from the jobs.ch API.
 */
interface SemanticSearchDocument {
    id: string;
}

/**
 * A semantic search response from the jobs.ch API.
 */
interface SemanticSearchResponse {
    documents: SemanticSearchDocument[];
    numPages: number;
    currentPage: number;
    totalHits: number;
    rows: number;
}

export type { SemanticSearchResponse };
