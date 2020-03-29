import styles from './check-box.module.scss';

const REFLECTED_PROPERTIES = ['checked', 'disabled'];
const REFLECTED_ATTRIBUTES = ['checked', 'disabled'];

const isTruthyAttributeValue = (attr: string, value: string | null): boolean => {
    return value === 'true' || value === '' || value === attr;
};

class CheckBoxElement extends HTMLElement {
    private _updating = false;
    private _connected = false;

    constructor() {
        super();

        this.addEventListener('click', () => {
            this._updating = true;
            const checked = isTruthyAttributeValue('checked', this.getAttribute('checked'));
            this.setAttribute('checked', checked ? 'false' : 'true');
            this._updating = false;
        });
    }

    static get observedAttributes(): Array<string> {
        return REFLECTED_ATTRIBUTES;
    }

    connectedCallback(): void {
        if (!this._connected) {
            this.className = styles.checkbox;
            this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
                    <path pathLength="100" d="M7,25L17.571,38,44,12"></path>
                </svg>
            `;

            this._connected = true;
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string | null): void {
        if (!this._updating && REFLECTED_ATTRIBUTES.includes(name)) {
            this.setAttribute(name, String(isTruthyAttributeValue(name, newValue)));
        }
    }
}

for (const prop of REFLECTED_PROPERTIES) {
    Object.defineProperty(
        CheckBoxElement.prototype,
        prop,
        {
            get() {
                const value = this.getAttribute(prop);

                if (value === 'true' || value === 'false') {
                    return value === 'true';
                }

                return value;
            },
            set(value) {
                this._updating = true;
                this.setAttribute(prop, value);
                this._updating = false;
            }
        }
    );
}

customElements.define('check-box', CheckBoxElement);
