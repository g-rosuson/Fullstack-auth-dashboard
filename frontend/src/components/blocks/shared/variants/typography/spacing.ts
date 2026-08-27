type SemanticSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type TypographySpacing = {
    none: 'mb-0';
} & { [K in SemanticSpacing]: `mb-${K}` };

const typographySpacing = {
    none: 'mb-0',
    xs: 'mb-xs',
    sm: 'mb-sm',
    md: 'mb-md',
    lg: 'mb-lg',
    xl: 'mb-xl',
} as const satisfies TypographySpacing;

export { typographySpacing };
export type { TypographySpacing };
