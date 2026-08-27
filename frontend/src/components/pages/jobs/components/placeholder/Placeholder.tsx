import Button from '@/components/blocks/button/Button';
import illustration from '@/components/ui-app/illustration/Illustration';

interface PlaceholderProps {
    openFormSheet: () => void;
}

const placeholder = 'No jobs exist yet, create your first job to get started.';

const Placeholder = ({ openFormSheet }: PlaceholderProps) => {
    return (
        <div className="flex flex-col items-center justify-center grow gap-md">
            <div className="flex flex-col items-center justify-center gap-md">
                <illustration.NotFound />

                <p className="text-center text-sm text-muted-foreground">{placeholder}</p>
            </div>

            <Button label="Create job" onClick={openFormSheet} />
        </div>
    );
};

export default Placeholder;
