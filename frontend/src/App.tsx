import { BrowserRouter } from 'react-router-dom';

import AppSetup from '@/components/container/appSetup/AppSetup';
import Routes from '@/components/routing/routes/Routes';
import { Toaster } from '@/components/ui-app/toast/Toast';

import './stylesheets/global.css';

// TODO: How do we handle variant ('success' | 'destructive' | 'warning' | 'primary' | 'muted' etc) mapping/typing?

// TODO: Look into autoCapitalize prop for title/heading components
// TODO: Only use "Title" naming for title/heading components?
// TODO: Radix uses "as" to render the correct heading tag, use this approach?

// TODO: Refine color palette's in dark and light mode

// TODO: Implement a strategy to handle content shift in modals and sheets
// TODO: - Always pop out instead of fade?

// TODO: Replace generic spinners with custom ones where it makes sense

// TODO: Go over test strategy, are we relying to much on test-id's?
// TODO: - Avoid userEvent.click (not recommended)?
const App = () => {
    return (
        <AppSetup>
            <Toaster>
                <BrowserRouter>
                    <Routes />
                </BrowserRouter>
            </Toaster>
        </AppSetup>
    );
};

export default App;
