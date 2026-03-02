import styles from './Card.module.css';

const Card = ({ children, className = '', hover = false, padding = true, ...props }) => (
    <div
        className={[styles.card, hover ? styles.hover : '', !padding ? styles.noPad : '', className].join(' ')}
        {...props}
    >
        {children}
    </div>
);

export default Card;
