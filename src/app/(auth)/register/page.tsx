'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { UserRole } from '@/lib/store';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { users, registerUser } = useStore();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'ADMIN' as UserRole
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (users.some(u => u.username === formData.username)) {
            setError(t.auth.usernameTaken);
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            const newUser = {
                id: crypto.randomUUID(),
                name: formData.name,
                username: formData.username,
                role: formData.role
            };
            registerUser(newUser);
            alert(t.auth.accountCreated);
            router.push('/login');
        }, 800);
    };

    return (
        <div className={styles.container}>
            <Card className={styles.loginCard}>
                <CardHeader>
                    <CardTitle>{t.auth.registerTitle}</CardTitle>
                    <CardDescription>{t.auth.registerDesc}</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className={styles.formContent}>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                        <Input
                            label={t.auth.name}
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label={t.auth.username}
                            placeholder="e.g. johndoe"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                        <Input
                            label={t.auth.password}
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label className="text-sm font-medium text-gray-500">{t.auth.role}</label>
                            <select
                                className="p-2 border rounded-md"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                style={{
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-main)'
                                }}
                            >
                                <option value="ADMIN">{t.auth.admin}</option>
                                <option value="CONTRIBUTOR">{t.auth.contributor}</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter style={{ flexDirection: 'column', gap: '1rem' }}>
                        <Button type="submit" className="w-full" isLoading={isLoading} style={{ width: '100%' }}>
                            {t.auth.createAccount}
                        </Button>
                        <div className="text-center text-sm">
                            {t.auth.alreadyHaveAccount} <Link href="/login" className="text-blue-500 hover:underline" style={{ color: 'var(--color-primary)' }}>{t.auth.signIn}</Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
            <div className={styles.backgroundBlur}></div>
        </div>
    );
}
