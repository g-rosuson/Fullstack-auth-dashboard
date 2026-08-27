import { NavLink, useLocation } from 'react-router-dom';

import type { SidebarProps } from './Sidebar.types';

import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import {
    Sidebar as SidebarPrimitive,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';

/**
 * Composes the shadcn sidebar with a product content model: labelled destinations and collapse.
 */
const Sidebar = ({ items, collapsible = 'offcanvas' }: SidebarProps) => {
    const { pathname } = useLocation();

    return (
        <SidebarPrimitive collapsible={collapsible}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-sm p-sm">
                            {items.map(item => {
                                const Icon = item.icon;
                                const isActive = pathname === item.to;

                                return (
                                    <SidebarMenuItem key={item.label} className="w-full">
                                        <SidebarMenuButton
                                            isActive={isActive}
                                            asChild
                                            className={textVariants({ size: 'sm' })}>
                                            <NavLink to={item.to} end>
                                                <Icon />
                                                {item.label}
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </SidebarPrimitive>
    );
};

export default Sidebar;

export type { SidebarItem, SidebarProps } from './Sidebar.types';
