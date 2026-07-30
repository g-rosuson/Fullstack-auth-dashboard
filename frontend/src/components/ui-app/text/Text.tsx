import React from 'react';
import { cva, VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

type TextProps = VariantProps<typeof textVariants> & {
    size: VariantProps<typeof textVariants>['size'];
    children: React.ReactNode;
    className?: string;
    isParagraph?: boolean;
    truncate?: boolean;
};

export const textVariants = cva('block', {
    variants: {
        size: {
            xs: 'text-xs',
            s: 'text-sm',
            m: 'text-base',
            l: 'text-lg',
        },
        weight: {
            normal: 'font-normal',
            semibold: 'font-semibold',
            bold: 'font-bold',
        },
        appearance: {
            primary: 'text-primary',
            muted: 'text-muted-foreground',
            foreground: 'text-foreground',
            warning: 'text-warning',
            destructive: 'text-destructive',
            success: 'text-success',
        },
    },
    defaultVariants: {
        size: 'm',
    },
});

// TODO: Create our own Text/layout component that uses our own Tailwind classes instead of Radix Themes.
// TODO: https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/text.tsx#L13

// TODO: Merge all shadcn components right? And then remove them right?

// It's possible, but be aware:

// ✅ shadcn + Radix Primitives is the standard combination.
// ⚠️ shadcn + Radix Themes can work, but you're mixing two design systems. Radix Themes has its own tokens, styling, and opinions, while shadcn is designed to be customized with Tailwind.

// If you're already using shadcn extensively, many developers stick with plain HTML elements plus Tailwind (or create their own Typography components) instead of bringing in Radix Themes just for typography. This keeps styling consistent and avoids adding another design layer.

const Text = ({ size, weight, appearance, children, className, isParagraph = false, truncate = false }: TextProps) => {
    const Tag = isParagraph ? 'p' : 'span';
    return (
        <Tag className={cn(textVariants({ size, weight, appearance }), className, truncate && 'truncate')}>
            {children}
        </Tag>
    );
};

export default Text;
