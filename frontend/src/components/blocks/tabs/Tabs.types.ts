import type { ReactNode } from 'react';

type TabItem = {
    value: string;
    label: string;
    children: ReactNode;
};

type TabsProps = {
    items: TabItem[];
};

export type { TabItem, TabsProps };
