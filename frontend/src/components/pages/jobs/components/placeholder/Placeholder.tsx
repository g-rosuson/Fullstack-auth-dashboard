import Button from '@/components/ui-app/button/Button';
import illustration from '@/components/ui-app/illustration/Illustration';

interface PlaceholderProps {
    openFormSheet: () => void;
}

const Placeholder = ({ openFormSheet }: PlaceholderProps) => {
    return (
        <div className="flex flex-col items-center justify-center grow-1 gap-4">
            <div className="flex flex-col items-center justify-center gap-4">
                <illustration.NotFound />

                <p className="text-center text-sm text-muted-foreground">
                    No jobs exist yet, create your first job to get started.
                </p>
            </div>

            <Button label="Create job" onClick={openFormSheet} />
        </div>
    );
};

export default Placeholder;
