import { NavLink, useLocation } from 'react-router-dom';

import Flex from '../flex/Flex';
import Text from '@/components/ui-app/text/Text';

import type { SidebarProps } from './Sidebar.types';

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

const Sidebar = ({ items, collapsible = 'offcanvas' }: SidebarProps) => {
    const { pathname } = useLocation();

    return (
        <SidebarPrimitive collapsible={collapsible}>
            <SidebarContent>
                {/* TODO: root padding is gap-2, but we use gap-4 as base padding, we need to centralize this ...  */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Flex direction="column" gap="s">
                                {items.map(item => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.to;

                                    return (
                                        <SidebarMenuItem key={item.label} className="w-full">
                                            <SidebarMenuButton isActive={isActive} asChild>
                                                <NavLink to={item.to}>
                                                    <Icon />
                                                    <Text size="s" variant="foreground">
                                                        {item.label}
                                                    </Text>
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </Flex>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </SidebarPrimitive>
    );
};

export default Sidebar;
