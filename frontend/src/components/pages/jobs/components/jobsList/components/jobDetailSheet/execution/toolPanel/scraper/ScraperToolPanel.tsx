import Tabs from '@/components/blocks/tabs/Tabs';
import Title from '@/components/blocks/title/Title';
import Text from '@/components/ui-app/text/Text';

import type { ScraperToolPanelProps } from './types/Scraper.types';

import ScraperTarget from './ScraperTarget';
import { ExecutionScraperToolTarget } from '@/_types/_gen';
import constants from '@/components/pages/jobs/components/jobsList/components/jobDetailSheet/constants';
import utils from '@/utils';

const ScraperToolPanel = ({ tool }: ScraperToolPanelProps) => {
    /**
     * Maps targets to the Tabs content model.
     */
    const mapToTabs = (targets: ExecutionScraperToolTarget[]) => {
        return targets.map(target => ({
            value: target.targetId,
            label: utils.string.capitalize(target.target),
            children: (
                <div>
                    <div className="flex gap-md">
                        <section className="flex flex-1 flex-col gap-sm p-md my-md border rounded-md">
                            <div>
                                <Title level={3} size="xs" spacing="xs">
                                    {constants.label.title.identifier}
                                </Title>
                                <Text size="xs">{target.targetId}</Text>
                            </div>
                            <div>
                                <Title level={3} size="xs" spacing="xs">
                                    {constants.label.title.keywords}
                                </Title>
                                <Text size="xs">{target.keywords?.join(', ') || '-'}</Text>
                            </div>

                            <div>
                                <Title level={3} size="xs" spacing="xs">
                                    {constants.label.title.maxPages}
                                </Title>
                                <Text size="xs">{target.maxPages}</Text>
                            </div>
                        </section>

                        <section className="flex flex-1 flex-col gap-sm p-md my-md border rounded-md">
                            <div>
                                <Title level={3} size="xs" spacing="xs">
                                    {constants.label.title.total}
                                </Title>
                                <Text size="xs">{target.summary.total}</Text>
                            </div>
                            <div>
                                <Title level={3} size="xs" spacing="xs">
                                    {constants.label.title.passed}
                                </Title>
                                <Text size="xs">{target.summary.passed}</Text>
                            </div>

                            <div>
                                <Title level={3} size="xs" spacing="xs">
                                    {constants.label.title.rejected}
                                </Title>
                                <Text size="xs">{target.summary.rejected}</Text>
                            </div>
                        </section>
                    </div>

                    <section>
                        <Title size="sm" spacing="xs" level={2}>
                            {constants.label.title.results}
                            <span className="text-sm font-normal">({target.results.length})</span>
                        </Title>

                        <ScraperTarget target={target} />
                    </section>
                </div>
            ),
        }));
    };

    return (
        <div>
            <section className="flex flex-col gap-sm p-md my-md border rounded-md">
                <div>
                    <Title level={3} size="xs" spacing="xs">
                        {constants.label.title.identifier}
                    </Title>
                    <Text size="xs">{tool.toolId}</Text>
                </div>
                <div>
                    <Title level={3} size="xs" spacing="xs">
                        {constants.label.title.keywords}
                    </Title>
                    <Text size="xs">{tool.keywords?.join(', ') || '-'}</Text>
                </div>

                <div>
                    <Title level={3} size="xs" spacing="xs">
                        {constants.label.title.maxPages}
                    </Title>
                    <Text size="xs">{tool.maxPages}</Text>
                </div>
            </section>

            <section className="pl-md">
                <Title size="sm" spacing="xs" level={2}>
                    {constants.label.title.targets} <span className="text-sm font-normal">({tool.targets.length})</span>
                </Title>

                <Tabs items={mapToTabs(tool.targets)} />
            </section>
        </div>
    );
};

export default ScraperToolPanel;
