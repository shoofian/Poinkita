'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FaUser, FaSave, FaCheckCircle, FaUserPlus, FaUsersCog, FaEnvelope, FaPhone } from 'react-icons/fa';
import { UserRole } from '@/lib/store';

export default function AccountSettingsPage() {
    const { currentUser, updateUser, registerUser, users, generateId } = useStore();
    const { t } = useLanguage();
    const { alert } = useDialog();

    const [activeTab, setActiveTab] = useState<'profile' | 'register'>('profile');

    // Profile State
    const [profileData, setProfileData] = useState({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: ''
    });
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isProfileSuccess, setIsProfileSuccess] = useState(false);

    // Register State
    const [registerData, setRegisterData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'CONTRIBUTOR' as UserRole,
        email: '',
        phone: ''
    });
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                name: currentUser.name || '',
                username: currentUser.username || '',
                password: currentUser.password || '',
                confirmPassword: currentUser.password || '',
                email: currentUser.email || '',
                phone: currentUser.phone || ''
            });
        }
    }, [currentUser]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (profileData.password !== profileData.confirmPassword) {
            alert({ title: "Error", message: "Passwords do not match.", variant: 'danger' });
            return;
        }

        setIsProfileLoading(true);
        setIsProfileSuccess(false);

        setTimeout(() => {
            updateUser(currentUser.id, {
                name: profileData.name,
                username: profileData.username,
                password: profileData.password,
                email: profileData.email,
                phone: profileData.phone
            });
            setIsProfileLoading(false);
            setIsProfileSuccess(true);
            setTimeout(() => setIsProfileSuccess(false), 3000);
            alert({ title: "Success", message: "Profile updated successfully!", variant: 'success' });
        }, 800);
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegisterLoading(true);

        if (users.some(u => u.username === registerData.username)) {
            alert({ title: "Error", message: t.auth.usernameTaken, variant: 'danger' });
            setIsRegisterLoading(false);
            return;
        }

        setTimeout(async () => {
            const newUser = {
                id: generateId('USR'),
                name: registerData.name,
                username: registerData.username,
                password: registerData.password,
                role: registerData.role,
                email: registerData.email,
                phone: registerData.phone
            };
            registerUser(newUser);
            setIsRegisterLoading(false);
            setRegisterData({ name: '', username: '', password: '', role: 'CONTRIBUTOR', email: '', phone: '' });
            await alert({
                title: t.auth.registerTitle,
                message: t.auth.accountCreated,
                variant: 'success'
            });
        }, 800);
    };

    if (!currentUser) {
        return <div className="p-8 text-center text-gray-500">Please login to view settings.</div>;
    }

    const isAdmin = currentUser.role === 'ADMIN';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                }}>
                    <FaUsersCog />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t.sidebar.accountSettings || 'Account Settings'}</h1>
            </div>

            {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
                            cursor: 'pointer'
                        }}
                    >
                        {t.auth.myProfile || 'My Profile'}
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'register' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'register' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: activeTab === 'register' ? 'bold' : 'normal',
                            cursor: 'pointer'
                        }}
                    >
                        {t.auth.registerTitle || 'Create New Account'}
                    </button>
                </div>
            )}

            {activeTab === 'profile' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.auth.name || 'Personal Information'}</CardTitle>
                        <CardDescription>Update your display name and contact credentials.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSaveProfile}>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <Input
                                    label={t.auth.name || 'Full Name'}
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label={t.auth.username || 'Username'}
                                    value={profileData.username}
                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <Input
                                    label={t.auth.email || 'Email Address'}
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                />
                                <Input
                                    label={t.auth.phone || 'Phone Number'}
                                    type="tel"
                                    placeholder="081234567890"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0', paddingTop: '1rem' }}>
                                <CardDescription style={{ marginBottom: '1rem' }}>Change your password below if needed.</CardDescription>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <Input
                                        label={t.auth.password || 'New Password'}
                                        type="password"
                                        value={profileData.password}
                                        onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={profileData.confirmPassword}
                                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                            {isProfileSuccess && (
                                <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <FaCheckCircle /> Saved!
                                </span>
                            )}
                            <Button type="submit" isLoading={isProfileLoading} className="flex items-center gap-2">
                                <FaSave /> {t.common.save}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.auth.registerTitle}</CardTitle>
                        <CardDescription>{t.auth.registerDesc}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <Input
                                    label={t.auth.name}
                                    placeholder="e.g. John Doe"
                                    value={registerData.name}
                                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label={t.auth.username}
                                    placeholder="e.g. johndoe"
                                    value={registerData.username}
                                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <Input
                                    label={t.auth.email}
                                    type="email"
                                    placeholder="user@example.com"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                />
                                <Input
                                    label={t.auth.phone}
                                    type="tel"
                                    placeholder="0812..."
                                    value={registerData.phone}
                                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <Input
                                    label={t.auth.password}
                                    type="password"
                                    placeholder="••••••••"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    required
                                />
                                <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label className="text-sm font-medium text-gray-500">{t.auth.role}</label>
                                    <select
                                        className="p-2 border rounded-md"
                                        value={registerData.role}
                                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as UserRole })}
                                        style={{
                                            padding: '0.75rem 0.875rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text-main)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <option value="ADMIN">{t.auth.admin}</option>
                                        <option value="CONTRIBUTOR">{t.auth.contributor}</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter style={{ justifyContent: 'flex-end' }}>
                            <Button type="submit" isLoading={isRegisterLoading} className="flex items-center gap-2">
                                <FaUserPlus /> {t.auth.createAccount}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}
        </div>
    );
}
