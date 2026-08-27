import type { TextProps } from './Text.types';

import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import { cn } from '@/lib/utils';

/**
 * Renders body copy with the shared text type scale.
 */
const Text = ({ children, className, as: Tag = 'p', variant, size, spacing, weight, align }: TextProps) => {
    return <Tag className={cn(textVariants({ size, spacing, variant, weight, align }), className)}>{children}</Tag>;
};

Text.displayName = 'Text';

export default Text;

export type { TextProps } from './Text.types';
