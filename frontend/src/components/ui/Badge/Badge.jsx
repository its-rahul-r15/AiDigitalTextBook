import styles from './Badge.module.css';

const Badge = ({ children, variant = 'primary', className = '' }) => (
    <span className={[styles.badge, styles[variant], className].join(' ')}>
        {children}
    </span>
);

export default Badge;
