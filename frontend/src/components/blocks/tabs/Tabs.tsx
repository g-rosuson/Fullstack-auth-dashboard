import type { TabsProps } from './Tabs.types';

import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import { Tabs as TabsPrimitive, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Composes the shadcn tabs with a product content model: labelled tabs and their panels.
 */
const Tabs = ({ items }: TabsProps) => {
    return (
        <TabsPrimitive defaultValue={items[0]?.value}>
            <TabsList variant="line">
                {items.map(item => (
                    <TabsTrigger key={item.value} value={item.value} className={textVariants({ size: 'xs' })}>
                        {item.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {items.map(item => (
                <TabsContent key={item.value} value={item.value}>
                    {item.children}
                </TabsContent>
            ))}
        </TabsPrimitive>
    );
};

export default Tabs;

export type { TabItem, TabsProps } from './Tabs.types';
