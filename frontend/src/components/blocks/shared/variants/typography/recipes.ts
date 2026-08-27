import { textVariants } from './text.variants';

const chromeLabel = () => textVariants({ size: 'sm', weight: 'medium' });

const surfaceDescription = () => textVariants({ size: 'sm', variant: 'muted' });

export { chromeLabel, surfaceDescription };
