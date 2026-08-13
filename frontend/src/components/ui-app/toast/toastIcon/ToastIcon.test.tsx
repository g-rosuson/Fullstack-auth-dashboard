import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ToastType } from '../Toast.types';

import ToastIcon from './ToastIcon';

describe('ToastIcon', () => {
    it.each(['success', 'info', 'warning', 'error'] as ToastType[])('renders an icon for type "%s"', type => {
        const { container } = render(<ToastIcon type={type} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders a loading status for type "loading"', () => {
        render(<ToastIcon type="loading" />);
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('renders nothing when type is omitted', () => {
        const { container } = render(<ToastIcon />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for an unknown type', () => {
        const { container } = render(<ToastIcon type="unknown" />);
        expect(container).toBeEmptyDOMElement();
    });
});
