import Heading from '@/components/ui-app/heading/Heading';
import Tabs from '@/components/ui-app/tabs/Tabs';
import Text from '@/components/ui-app/text/Text';

import type { ScraperToolPanelProps } from './types/Scraper.types';

import ScraperTarget from './ScraperTarget';
import { ExecutionScraperToolTarget } from '@/_types/_gen';
import constants from '@/components/pages/jobs/components/jobsList/components/jobDetailSheet/constants';
import utils from '@/utils';

const ScraperToolPanel = ({ tool }: ScraperToolPanelProps) => {
    /**
     * Maps the targets to tabs and tab contents.
     */
    const mapToTabs = (targets: ExecutionScraperToolTarget[]) => {
        const tabs = targets.map(target => ({
            value: target.targetId,
            label: utils.string.capitalize(target.target),
        }));

        const tabContents = targets.map(target => ({
            value: target.targetId,
            children: (
                <div>
                    <div className="flex gap-md">
                        <section className="flex flex-1 flex-col gap-sm p-md my-md border rounded-md">
                            <div>
                                <Heading level={3} size="xs" spacing="xs">
                                    {constants.label.title.identifier}
                                </Heading>
                                <Text size="xs">{target.targetId}</Text>
                            </div>
                            <div>
                                <Heading level={3} size="xs" spacing="xs">
                                    {constants.label.title.keywords}
                                </Heading>
                                <Text size="xs">{target.keywords?.join(', ') || '-'}</Text>
                            </div>

                            <div>
                                <Heading level={3} size="xs" spacing="xs">
                                    {constants.label.title.maxPages}
                                </Heading>
                                <Text size="xs">{target.maxPages}</Text>
                            </div>
                        </section>

                        <section className="flex flex-1 flex-col gap-sm p-md my-md border rounded-md">
                            <div>
                                <Heading level={3} size="xs" spacing="xs">
                                    {constants.label.title.total}
                                </Heading>
                                <Text size="xs">{target.summary.total}</Text>
                            </div>
                            <div>
                                <Heading level={3} size="xs" spacing="xs">
                                    {constants.label.title.passed}
                                </Heading>
                                <Text size="xs">{target.summary.passed}</Text>
                            </div>

                            <div>
                                <Heading level={3} size="xs" spacing="xs">
                                    {constants.label.title.rejected}
                                </Heading>
                                <Text size="xs">{target.summary.rejected}</Text>
                            </div>
                        </section>
                    </div>

                    <section>
                        <Heading size="sm" spacing="xs" level={2}>
                            {constants.label.title.results}
                            <span className="text-sm font-normal">({target.results.length})</span>
                        </Heading>

                        <ScraperTarget target={target} />
                    </section>
                </div>
            ),
        }));

        return { tabs, tabContents };
    };

    return (
        <div>
            <section className="flex flex-col gap-sm p-md my-md border rounded-md">
                <div>
                    <Heading level={3} size="xs" spacing="xs">
                        {constants.label.title.identifier}
                    </Heading>
                    <Text size="xs">{tool.toolId}</Text>
                </div>
                <div>
                    <Heading level={3} size="xs" spacing="xs">
                        {constants.label.title.keywords}
                    </Heading>
                    <Text size="xs">{tool.keywords?.join(', ') || '-'}</Text>
                </div>

                <div>
                    <Heading level={3} size="xs" spacing="xs">
                        {constants.label.title.maxPages}
                    </Heading>
                    <Text size="xs">{tool.maxPages}</Text>
                </div>
            </section>

            <section className="pl-md">
                <Heading size="sm" spacing="xs" level={2}>
                    {constants.label.title.targets} <span className="text-sm font-normal">({tool.targets.length})</span>
                </Heading>

                <Tabs tabs={mapToTabs(tool.targets).tabs} tabContents={mapToTabs(tool.targets).tabContents} />
            </section>
        </div>
    );
};

export default ScraperToolPanel;
