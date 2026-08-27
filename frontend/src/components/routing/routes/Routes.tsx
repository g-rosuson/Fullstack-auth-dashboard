import { Navigate, Route, Routes as ReactRouterDOMRoutes } from 'react-router-dom';

import Authenticate from '../../layout/authenticate/Authenticate';
import Authentication from '../../pages/authentication/Authentication';
import Home from '../../pages/home/Home';
import Jobs from '../../pages/jobs/Jobs';

import config from '@/config';

const Routes = () => {
    return (
        <ReactRouterDOMRoutes>
            <Route path={config.routes.login} element={<Authentication />} />
            {config.features.isRegistrationEnabled ? (
                <Route path={config.routes.register} element={<Authentication />} />
            ) : (
                <Route path={config.routes.register} element={<Navigate to={config.routes.login} replace />} />
            )}

            <Route element={<Authenticate />}>
                <Route path={config.routes.root} element={<Home />} />
                <Route path={config.routes.jobs} element={<Jobs />} />
            </Route>
        </ReactRouterDOMRoutes>
    );
};

export default Routes;
