import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

import ToolPanel from './toolPanel/ToolPanel';
import Tabs from '@/components/blocks/tabs/Tabs';
import Text from '@/components/blocks/text/Text';
import Title from '@/components/blocks/title/Title';

import type { CollapsibleExecutionProps } from './types/Execution.types';
import type { ExecutionTool } from '@/_types/_gen';

import constants from '@/components/pages/jobs/components/jobsList/components/jobDetailSheet/constants';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import utils from '@/utils';

/**
 * Execution detail: collapsible schedule info, then per-tool tabs and per-target tabs.
 * Tool kind is branched at the tool level so targets are correctly typed for each renderer.
 */
const CollapsibleExecution = ({ execution }: CollapsibleExecutionProps) => {
    // State
    const [isOpen, setIsOpen] = useState(false);

    // Determine the information section
    const information = (
        <section className="flex flex-col gap-sm border rounded-md p-md">
            <div>
                <Title level={3} size="xs" spacing="xs">
                    {constants.label.title.identifier}
                </Title>

                <Text size="xs">{execution.executionId}</Text>
            </div>

            <div>
                <Title level={3} size="xs" spacing="xs">
                    {constants.label.title.delegatedAt}
                </Title>
                <Text size="xs">{new Date(execution.schedule.delegatedAt).toLocaleString()}</Text>
            </div>

            <div>
                <Title level={3} size="xs" spacing="xs">
                    {constants.label.title.finishedAt}
                </Title>

                <Text size="xs">{new Date(execution.schedule.finishedAt || '').toLocaleString()}</Text>
            </div>

            {execution.schedule.cancelledAt && (
                <div>
                    <Title level={3} size="xs" spacing="xs">
                        {constants.label.title.cancelledAt}
                    </Title>
                    <Text size="xs">{new Date(execution.schedule.cancelledAt).toLocaleString()}</Text>
                </div>
            )}
        </section>
    );

    /**
     * Maps tools to the Tabs content model.
     */
    const mapToTabs = (tools: ExecutionTool[]) => {
        return tools.map(tool => ({
            value: tool.toolId,
            label: utils.string.capitalize(tool.type),
            children: <ToolPanel tool={tool} />,
        }));
    };

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full border rounded-md data-[state=open]:bg-muted">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full">
                    <Text size="xs" variant="foreground">
                        {new Date(execution.schedule.finishedAt || execution.schedule.delegatedAt).toLocaleString()}
                    </Text>

                    <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="p-md">
                <section className="mb-md">{information}</section>

                <Title size="sm" spacing="xs" level={2}>
                    {constants.label.title.tools}{' '}
                    <span className="text-sm font-normal">({execution.tools.length})</span>
                </Title>

                <Tabs items={mapToTabs(execution.tools)} />
            </CollapsibleContent>
        </Collapsible>
    );
};

export default CollapsibleExecution;
