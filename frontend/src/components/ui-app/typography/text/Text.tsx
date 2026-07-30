import React from 'react';

import { TextVariants, textVariants } from '../shared/variants/text.variants';
import { cn } from '@/lib/utils';

type TextProps = TextVariants & {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
};

const Text = (props: TextProps) => {
    const { children, className, as: Tag = 'p', appearance, size, weight } = props;

    return <Tag className={cn(textVariants({ size, appearance, weight }), className)}>{children}</Tag>;
};

Text.displayName = 'Text';

export default Text;
