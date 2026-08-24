import React from 'react';

import { TextVariants, textVariants } from '../shared/variants/text.variants';
import { TypographySpacing } from '../shared/variants/typography.spacing';
import { cn } from '@/lib/utils';

type TextProps = Omit<TextVariants, 'size' | 'spacing'> & {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    spacing?: keyof TypographySpacing;
};

const Text = (props: TextProps) => {
    const { children, className, as: Tag = 'p', variant, size, spacing, weight, align } = props;

    return <Tag className={cn(textVariants({ size, spacing, variant, weight, align }), className)}>{children}</Tag>;
};

Text.displayName = 'Text';

export default Text;
