type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

type SpinnerProps = {
    size?: SpinnerSize;
    type?: 'circle' | 'dotted';
    variant?: 'primary' | 'foreground' | 'muted' | 'success' | 'warning' | 'destructive';
    speed?: 'slow' | 'medium' | 'fast';
    className?: string;
};

export type { SpinnerProps, SpinnerSize };
