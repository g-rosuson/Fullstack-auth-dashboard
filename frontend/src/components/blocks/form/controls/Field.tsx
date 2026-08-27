import FieldBlock from '@/components/blocks/field/Field';

import type { FormTextField } from '../Form.types';

/**
 * A labeled text input aligned to the form field config.
 */
const Field = (props: FormTextField) => {
    return <FieldBlock {...props} />;
};

export default Field;
