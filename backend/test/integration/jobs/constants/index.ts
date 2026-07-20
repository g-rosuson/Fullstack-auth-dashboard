/** ~20 days ahead: stays under Node's ~32‑bit signed `setTimeout` max (~24.8 days). */
const INTEGRATION_JOB_START_DELAY_MS = 20 * 24 * 60 * 60 * 1000;

export { INTEGRATION_JOB_START_DELAY_MS };
