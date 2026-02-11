'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { users, currentUser, setCurrentUser } = useStore();
    const { t } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === 'ADMIN') {
                router.push('/dashboard');
            } else {
                router.push('/dashboard/transactions');
            }
        }
    }, [currentUser, router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            const normalizedUsername = username.trim().toLowerCase();
            const user = users.find(u => u.username.toLowerCase() === normalizedUsername);

            if (user && user.password === password) {
                setCurrentUser(user);

                if (user.role === 'ADMIN') {
                    router.push('/dashboard');
                } else {
                    router.push('/dashboard/transactions');
                }
            } else {
                setError(t.auth.invalidCredentials);
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className={styles.container}>
            <Card className={styles.loginCard}>
                <CardHeader>
                    <CardTitle>{t.auth.loginTitle}</CardTitle>
                    <CardDescription>{t.auth.loginDesc}</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className={styles.formContent}>
                        {error && <div className={styles.errorMessage}>{error}</div>}
                        <Input
                            label={t.auth.username}
                            placeholder="e.g. admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            label={t.auth.password}
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </CardContent>
                    <CardFooter style={{ flexDirection: 'column', gap: '1rem' }}>
                        <Button type="submit" className="w-full" isLoading={isLoading} style={{ width: '100%' }}>
                            {t.auth.signIn}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <div className={styles.backgroundBlur}></div>
        </div>
    );
}
