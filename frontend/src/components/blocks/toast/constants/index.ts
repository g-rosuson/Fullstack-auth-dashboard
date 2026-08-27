const constants = {
    type: {
        success: 'success',
        info: 'info',
        warning: 'warning',
        error: 'error',
        loading: 'loading',
    },
} as const;

/**
 * Derived here so `typeof` can see the runtime object. Types-only modules
 * must `import type` this union — they cannot value-import this file just to
 * derive it, or they become an extra edge on the bundle graph.
 */
type ToastType = (typeof constants.type)[keyof typeof constants.type];

export default constants;
export type { ToastType };
