import React from 'react';
import { Trash2Icon } from 'lucide-react';

import KeyWordsField from '../keywordsField/KeywordsField';
import Flex from '@/components/blocks/flex/Flex';
import Text from '@/components/blocks/text/Text';
import Title from '@/components/blocks/title/Title';
import Field from '@/components/ui-app/field/Field';
import Select from '@/components/ui-app/select/Select';

import type { ScraperToolProps } from './types/ScraperTool.types';

import { ScraperToolTargetName } from '@/_types/_gen/scraperToolTargetName';
import constants from '@/components/pages/jobs/components/jobFormSheet/constants';
import { Button } from '@/components/ui/button';

const ScraperTool = ({ tool, onChange }: ScraperToolProps) => {
    /**
     * Handles the change event for the global max pages input.
     */
    const onToolMaxPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onChange({ ...tool, maxPages: Number(e.target.value) });
    };

    /**
     * Handles the change event for the global keywords input.
     */
    const onToolKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onChange({ ...tool, keyword: e.target.value });
    };

    /**
     * Handles the change event for the target select.
     */
    const onTargetChange = (option: { value: ScraperToolTargetName; label: string } | undefined) => {
        const newTarget = {
            target: option?.value || '',
            label: option?.label || '',
            keyword: '',
            keywords: [],
            maxPages: 0,
        };

        onChange({ ...tool, targets: [...tool.targets, newTarget] });
    };

    /**
     * Handles the key down event for the input.
     */
    const onKeywordInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tool.keyword?.trim() !== '') {
            e.preventDefault();
            // Captured before onChange to avoid reading currentTarget after React nullifies the synthetic event
            const value = e.currentTarget.value;
            onChange({ ...tool, keyword: '', keywords: [...tool.keywords, value] });
        }
    };

    /**
     * Handles the add keyword event.
     */
    const onKeywordAdd = () => {
        if (tool.keyword?.trim() === '') return;
        onChange({ ...tool, keyword: '', keywords: [...tool.keywords, tool.keyword || ''] });
    };

    /**
     * Handles the remove keyword event.
     */
    const onKeywordRemove = (index: number) => {
        onChange({ ...tool, keywords: tool.keywords.filter((_, i) => i !== index) || [] });
    };

    /**
     * Handles the key down event for the target keyword input.
     */
    const onTargetKeywordInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, targetIndex: number) => {
        const isEnter = e.key === 'Enter';
        const hasValue = e.currentTarget.value.trim() !== '';

        if (isEnter && hasValue) {
            e.preventDefault();
            // Captured before onChange to avoid reading currentTarget after React nullifies the synthetic event
            const keyword = e.currentTarget.value;

            const updatedTargets = tool.targets.map((target, i) => {
                if (i !== targetIndex) return target;

                const updatedKeywords = [...target.keywords, keyword];
                return {
                    ...target,
                    keyword: '',
                    keywords: updatedKeywords,
                };
            });

            onChange({ ...tool, targets: updatedTargets });
        }
    };

    /**
     * Handles the change event for the target keyword input.
     */
    const onTargetKeywordChange = (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number) => {
        const keyword = e.target.value;

        const updatedTargets = tool.targets.map((target, i) => {
            if (i !== targetIndex) return target;
            return { ...target, keyword };
        });

        onChange({ ...tool, targets: updatedTargets });
    };

    /**
     * Handles the change event for the target max pages input.
     */
    const onTargetMaxPagesChange = (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number) => {
        const maxPages = Number(e.target.value);

        const updatedTargets = tool.targets.map((target, i) => {
            if (i !== targetIndex) return target;
            return { ...target, maxPages };
        });

        onChange({ ...tool, targets: updatedTargets });
    };

    /**
     * Handles the add keyword event for the target.
     */
    const onTargetKeywordAdd = (targetIndex: number) => {
        const updatedTargets = tool.targets.map((target, i) => {
            if (i !== targetIndex) return target;
            if (target.keyword.trim() === '') return target;

            const updatedKeywords = [...target.keywords, target.keyword];
            return {
                ...target,
                keyword: '',
                keywords: updatedKeywords,
            };
        });

        onChange({ ...tool, targets: updatedTargets });
    };

    /**
     * Handles the remove event for a target.
     */
    const onTargetRemove = (targetIndex: number) => {
        onChange({ ...tool, targets: tool.targets.filter((_, i) => i !== targetIndex) });
    };

    /**
     * Handles the remove keyword event for the target.
     */
    const onTargetKeywordRemove = (targetIndex: number, keywordIndex: number) => {
        const updatedTargets = tool.targets.map((target, i) => {
            if (i !== targetIndex) return target;

            const updatedKeywords = target.keywords.filter((_, j) => j !== keywordIndex);
            return {
                ...target,
                keywords: updatedKeywords,
            };
        });

        onChange({ ...tool, targets: updatedTargets });
    };

    // Determine validation flags
    const hasGlobalMaxPages = !!tool.maxPages;
    const hasGlobalKeywords = tool.keywords.length > 0;
    const everyTargetHasKeywords = tool.targets.length > 0 && tool.targets.every(target => target.keywords.length > 0);
    const everyTargetHasMaxPages = tool.targets.length > 0 && tool.targets.every(target => !!target.maxPages);

    // Determine the scraper targets from the ScraperToolTargetName enum
    const scraperTargets = Object.values(ScraperToolTargetName).map(target => {
        const label = target.charAt(0).toUpperCase() + target.slice(1);
        return {
            value: target,
            label,
        };
    });

    return (
        <>
            <Flex direction="column" gap="sm">
                <Title level={3} size="md" spacing="none">
                    Global tool settings
                </Title>
                <Text size="sm" variant="muted">
                    Define settings applied to all targets.
                </Text>
            </Flex>

            <Field
                type="number"
                name="maxPages"
                label={constants.label.field.maxPages.label}
                value={tool.maxPages}
                placeholder={constants.label.field.maxPages.placeholder}
                onChange={onToolMaxPagesChange}
                required={!everyTargetHasMaxPages}
            />

            <div>
                <KeyWordsField
                    label={constants.label.field.keywords.label}
                    name="keywords"
                    value={tool.keyword || ''}
                    placeholder={constants.label.field.keywords.placeholder}
                    onKeyDown={onKeywordInputKeyDown}
                    onChange={onToolKeywordChange}
                    onClick={onKeywordAdd}
                    required={!everyTargetHasKeywords}
                    hasKeywords={hasGlobalKeywords || everyTargetHasKeywords}
                    keywords={tool.keywords}
                    onKeywordRemove={onKeywordRemove}
                />
            </div>

            <Flex direction="column" gap="sm">
                <Title level={3} size="md" spacing="none">
                    {constants.label.title.targets}
                </Title>
                <Text size="sm" variant="muted">
                    {constants.label.description.targets}
                </Text>
            </Flex>

            <Select
                onChange={onTargetChange}
                value=""
                className="w-full"
                label={constants.label.field.target.label}
                placeholder={constants.label.field.target.placeholder}
                options={scraperTargets}
                id="scraper-tool-target-field"
            />

            {tool.targets.map((target, index) => (
                <Flex as="article" key={index} direction="column" gap="md" className="border rounded-lg p-md ml-sm">
                    <Flex align="center" justify="between">
                        <span className="font-bold">{target.label}</span>

                        <Button
                            type="button"
                            variant="destructive"
                            size="icon-xs"
                            aria-label={constants.label.button.target.remove.ariaLabel}
                            onClick={() => onTargetRemove(index)}>
                            <Trash2Icon />
                        </Button>
                    </Flex>

                    <Field
                        type="number"
                        name="maxPages"
                        value={target.maxPages}
                        label={constants.label.field.maxPages.label}
                        placeholder={constants.label.field.maxPages.placeholder}
                        onChange={e => onTargetMaxPagesChange(e, index)}
                        required={!hasGlobalMaxPages}
                    />

                    <div>
                        <KeyWordsField
                            label={constants.label.field.keywords.label}
                            name="keywords"
                            value={target.keyword || ''}
                            placeholder={constants.label.field.keywords.placeholder}
                            onChange={e => onTargetKeywordChange(e, index)}
                            onClick={() => onTargetKeywordAdd(index)}
                            onKeyDown={e => onTargetKeywordInputKeyDown(e, index)}
                            required={!hasGlobalKeywords}
                            hasKeywords={hasGlobalKeywords || target.keywords.length > 0}
                            keywords={target.keywords}
                            onKeywordRemove={(keywordIndex: number) => onTargetKeywordRemove(index, keywordIndex)}
                        />
                    </div>
                </Flex>
            ))}
        </>
    );
};

export default ScraperTool;
