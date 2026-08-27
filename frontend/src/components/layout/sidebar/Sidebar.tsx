import { BriefcaseBusiness, Home } from 'lucide-react';

import AppSidebar from '@/components/blocks/sidebar/Sidebar';

import config from '@/config';

const Sidebar = () => {
    // Determine side-bar items
    const sidebarNavItems = [
        {
            label: 'Home',
            icon: Home,
            to: config.routes.root,
        },
        {
            label: 'Jobs',
            icon: BriefcaseBusiness,
            to: config.routes.jobs,
        },
    ];

    return <AppSidebar items={sidebarNavItems} />;
};

export default Sidebar;
