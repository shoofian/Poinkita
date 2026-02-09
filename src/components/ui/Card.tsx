import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
    return <div className={clsx(styles.card, className)} {...props}>{children}</div>;
};

export const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => {
    return <div className={clsx(styles.header, className)} {...props}>{children}</div>;
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
    return <h3 className={clsx(styles.title, className)} {...props}>{children}</h3>;
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => {
    return <p className={clsx(styles.description, className)} {...props}>{children}</p>;
};

export const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => {
    return <div className={clsx(styles.content, className)} {...props}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({ className, children, ...props }) => {
    return <div className={clsx(styles.footer, className)} {...props}>{children}</div>;
};
