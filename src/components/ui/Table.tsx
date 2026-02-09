import React from 'react';
import clsx from 'clsx';
import styles from './Table.module.css';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => {
    return (
        <div className={styles.tableContainer}>
            <table className={clsx(styles.table, className)} {...props}>{children}</table>
        </div>
    );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => {
    return <thead className={clsx(styles.thead, className)} {...props}>{children}</thead>;
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => {
    return <tbody className={className} {...props}>{children}</tbody>;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => {
    return <tr className={clsx(styles.tr, className)} {...props}>{children}</tr>;
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => {
    return <th className={clsx(styles.th, className)} {...props}>{children}</th>;
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => {
    return <td className={clsx(styles.td, className)} {...props}>{children}</td>;
};
