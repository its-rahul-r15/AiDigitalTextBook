import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
    label,
    error,
    hint,
    type = 'text',
    id,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={[styles.wrapper, className].join(' ')}>
            {label && <label className={styles.label} htmlFor={id}>{label}</label>}
            <input
                ref={ref}
                id={id}
                type={type}
                className={[styles.input, error ? styles.hasError : ''].join(' ')}
                {...props}
            />
            {error && <span className={styles.error}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
