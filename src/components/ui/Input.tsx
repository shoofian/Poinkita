import React, { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className={styles.inputContainer}>
                {label && <label className={styles.label}>{label}</label>}
                <input
                    ref={ref}
                    className={clsx(styles.input, className)}
                    {...props}
                />
                {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
