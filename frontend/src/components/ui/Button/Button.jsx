import styles from './Button.module.css';

const Button = ({
    children,
    variant = 'primary',
    primary = false, // Consume this to prevent leaking to DOM
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    type = 'button',
    onClick,
    className = '',
    ...props
}) => {
    const finalVariant = primary ? 'primary' : variant;
    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={[
                styles.btn,
                styles[finalVariant],
                styles[size],
                fullWidth ? styles.fullWidth : '',
                loading ? styles.loading : '',
                className,
            ].join(' ')}
            {...props}
        >
            {loading ? <span className={styles.spinner} /> : children}
        </button>
    );
};

export default Button;
