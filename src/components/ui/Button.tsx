import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    isLoading,
    children,
    disabled,
    ...props
}) => {
    return (
        <button
            className={clsx(styles.button, styles[variant], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <span className={styles.loader}>...</span> : children}
        </button>
    );
};
