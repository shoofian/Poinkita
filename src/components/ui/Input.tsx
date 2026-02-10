import React, { forwardRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className={styles.inputContainer}>
                {label && <label className={styles.label}>{label}</label>}
                <div className={styles.wrapper}>
                    <input
                        ref={ref}
                        type={inputType}
                        className={clsx(styles.input, className, isPassword && styles.inputWithIcon)}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            className={styles.toggleBtn}
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    )}
                </div>
                {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
