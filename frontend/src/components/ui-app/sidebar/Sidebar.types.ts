import type { LucideIcon } from 'lucide-react';

/**
 * A navigation item rendered in the sidebar.
 */
interface SidebarItem {
    label: string;
    icon: LucideIcon;
    to: string;
}

/**
 * The props for the Sidebar component.
 */
interface SidebarProps {
    items: SidebarItem[];
    collapsible?: 'offcanvas' | 'icon' | 'none';
}

export type { SidebarItem, SidebarProps };
