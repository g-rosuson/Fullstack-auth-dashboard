import React from 'react';

import Flex from '@/components/ui-app/flex/Flex';

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
    titleAddon?: React.ReactNode;
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
    titleAddon,
    description,
    headerActions,
    footer,
    children,
    className,
    onClick,
}: CardProps) => {
    let descriptionContent = null;

    if (description) {
        descriptionContent = <CardDescription size="sm">{description}</CardDescription>;
    }

    let headerActionsContent = null;

    if (headerActions) {
        headerActionsContent = <CardAction onClick={event => event.stopPropagation()}>{headerActions}</CardAction>;
    }

    let childrenContent = null;

    if (children) {
        childrenContent = <CardContent>{children}</CardContent>;
    }

    let footerContent = null;

    if (footer) {
        footerContent = <CardFooter>{footer}</CardFooter>;
    }

    return (
        <CardPrimitive className={cn(onClick && 'cursor-pointer', className)} onClick={onClick}>
            <CardHeader>
                <Flex direction="column" gap="xs" className="min-w-0">
                    <CardTitle size={titleSize} className="min-w-0 truncate">
                        {title}
                    </CardTitle>

                    {titleAddon}
                </Flex>

                {descriptionContent}

                {headerActionsContent}
            </CardHeader>

            {childrenContent}

            {footerContent}
        </CardPrimitive>
    );
};

export default Card;

export type { CardProps };
