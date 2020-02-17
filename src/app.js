import './styles.css';

import('../crate/pkg').then(module => {
    module.random_number();
});
