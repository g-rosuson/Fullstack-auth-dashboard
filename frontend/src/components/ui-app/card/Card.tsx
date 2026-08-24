import React from 'react';

import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    onClick?: () => void;
}

const Card = ({ children, className, as: Tag = 'div', onClick }: CardProps) => {
    const classes = cn('cursor-pointer border border-border rounded-lg p-md bg-surface', className);
    return (
        <Tag className={classes} onClick={onClick}>
            {children}
        </Tag>
    );
};

Card.displayName = 'Card';

export default Card;
