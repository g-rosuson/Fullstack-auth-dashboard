import type { LucideIcon } from 'lucide-react';

type SidebarItem = {
    label: string;
    icon: LucideIcon;
    to: string;
};

type SidebarProps = {
    items: SidebarItem[];
    collapsible?: 'offcanvas' | 'icon' | 'none';
};

export type { SidebarItem, SidebarProps };
