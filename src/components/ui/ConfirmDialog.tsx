'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styles from './ConfirmDialog.module.css';

type DialogVariant = 'warning' | 'danger' | 'info' | 'success';

interface DialogOptions {
    title: string;
    message: string;
    variant?: DialogVariant;
    confirmLabel?: string;
    cancelLabel?: string;
}

interface AlertOptions {
    title: string;
    message: string;
    variant?: DialogVariant;
    okLabel?: string;
}

interface DialogContextType {
    confirm: (options: DialogOptions) => Promise<boolean>;
    alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

interface DialogState {
    type: 'confirm' | 'alert';
    options: DialogOptions | AlertOptions;
    resolve: (value: boolean) => void;
}

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<DialogState | null>(null);

    const confirm = useCallback((options: DialogOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setDialog({ type: 'confirm', options, resolve });
        });
    }, []);

    const alertFn = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise<void>((resolve) => {
            setDialog({ type: 'alert', options, resolve: () => resolve() });
        });
    }, []);

    const handleConfirm = () => {
        dialog?.resolve(true);
        setDialog(null);
    };

    const handleCancel = () => {
        dialog?.resolve(false);
        setDialog(null);
    };

    useEffect(() => {
        if (!dialog) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    });

    const variant = dialog?.options.variant || 'warning';
    const iconMap: Record<DialogVariant, string> = {
        warning: '⚠️',
        danger: '🗑️',
        info: 'ℹ️',
        success: '✅',
    };
    const variantClassMap: Record<DialogVariant, string> = {
        warning: styles.iconWarning,
        danger: styles.iconDanger,
        info: styles.iconInfo,
        success: styles.iconSuccess,
    };

    return (
        <DialogContext.Provider value={{ confirm, alert: alertFn }}>
            {children}
            {dialog && (
                <div className={styles.overlay} onClick={(e) => {
                    if (e.target === e.currentTarget) handleCancel();
                }}>
                    <div className={styles.dialog}>
                        <div className={styles.body}>
                            <div className={`${styles.icon} ${variantClassMap[variant]}`}>
                                {iconMap[variant]}
                            </div>
                            <div className={styles.title}>{dialog.options.title}</div>
                            <div className={styles.message}>{dialog.options.message}</div>
                        </div>
                        <div className={styles.footer}>
                            {dialog.type === 'confirm' ? (
                                <>
                                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancel}>
                                        {(dialog.options as DialogOptions).cancelLabel || 'Cancel'}
                                    </button>
                                    <button
                                        className={`${styles.btn} ${variant === 'danger' ? styles.btnDanger : styles.btnConfirm}`}
                                        onClick={handleConfirm}
                                    >
                                        {(dialog.options as DialogOptions).confirmLabel || 'Confirm'}
                                    </button>
                                </>
                            ) : (
                                <button className={`${styles.btn} ${styles.btnOk}`} onClick={handleConfirm}>
                                    {(dialog.options as AlertOptions).okLabel || 'OK'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
};
