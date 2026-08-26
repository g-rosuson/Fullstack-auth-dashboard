import React from 'react';

import {
    Card as CardPrimitive,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CardProps {
    title: React.ReactNode;
    titleSize?: 'xs' | 'sm' | 'md' | 'lg';
    description?: string;
    headerActions?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const Card = ({
    title,
    titleSize = 'lg',
    description,
    headerActions,
    footer,
    children,
    className,
    onClick,
}: CardProps) => {
    return (
        <CardPrimitive className={cn(onClick && 'cursor-pointer', className)} onClick={onClick}>
            <CardHeader>
                <CardTitle size={titleSize}>{title}</CardTitle>
                {description ? <CardDescription size="sm">{description}</CardDescription> : null}
                {headerActions ? (
                    <CardAction onClick={event => event.stopPropagation()}>{headerActions}</CardAction>
                ) : null}
            </CardHeader>

            {children ? <CardContent>{children}</CardContent> : null}

            {footer ? <CardFooter>{footer}</CardFooter> : null}
        </CardPrimitive>
    );
};

export default Card;

export type { CardProps };
