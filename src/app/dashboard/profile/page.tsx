'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { FaUser, FaSave, FaCheckCircle, FaUserPlus, FaUsersCog, FaEnvelope, FaPhone, FaEdit, FaTrash, FaFileExcel, FaDownload, FaMoon, FaSun, FaFingerprint } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { User, UserRole } from '@/lib/store';
import { useTheme } from '@/lib/context/ThemeContext';

export default function AccountSettingsPage() {
    const { currentUser, updateUser, deleteUser, registerUser, registerUsers, users, generateId } = useStore();
    const { t } = useLanguage();
    const { alert, confirm } = useDialog();
    const { theme, toggleTheme } = useTheme();

    const [activeTab, setActiveTab] = useState<'profile' | 'register' | 'manage'>('profile');

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

    const generateRandomPassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleGenerateRandomPassword = () => {
        setRegisterData(prev => ({ ...prev, password: generateRandomPassword() }));
    };

    // Manage Users State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUserData, setEditUserData] = useState({ name: '', username: '', password: '', email: '', phone: '' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
            setActiveTab('manage');
        }, 800);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const importedUsers: User[] = [];
                const importedCredentials: { name: string, username: string, password: string }[] = [];

                data.forEach((row) => {
                    const name = row.Name || row.Nama || row.name || row.nama;
                    const username = row.Username || row["Nama Pengguna"] || row.username || row.nama_pengguna;
                    const email = row.Email || row.email;
                    const phone = row.Phone || row["Nomor Telepon"] || row.phone || row.no_telp;
                    const role = (row.Role || row.Peran || 'CONTRIBUTOR').toUpperCase() as UserRole;

                    if (!name || !username) return;
                    if (users.some(u => u.username === username) || importedUsers.some(u => u.username === username)) return;

                    const password = generateRandomPassword();
                    const newUser: User = {
                        id: generateId('USR'),
                        name,
                        username,
                        password,
                        role,
                        email: email || '',
                        phone: phone || ''
                    };

                    importedUsers.push(newUser);
                    importedCredentials.push({ name, username, password });
                });

                if (importedUsers.length > 0) {
                    registerUsers(importedUsers);
                    alert({
                        title: "Import Success",
                        message: t.auth.importUserSuccess.replace('{0}', importedUsers.length.toString()),
                        variant: 'success'
                    });

                    // Automatically download the credentials file
                    const wsCreds = XLSX.utils.json_to_sheet(importedCredentials);
                    const wbCreds = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wbCreds, wsCreds, "Credentials");
                    XLSX.writeFile(wbCreds, `Poinkita_New_User_Credentials_${new Date().getTime()}.xlsx`);

                    setActiveTab('manage');
                } else {
                    alert({
                        title: "Import Failed",
                        message: "No valid and unique user data found.",
                        variant: 'danger'
                    });
                }
            } catch (error) {
                console.error("Excel Import Error:", error);
                alert({ title: "Error", message: "Failed to process Excel file.", variant: 'danger' });
            }
            if (e.target) e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const downloadUserTemplate = () => {
        const templateData = [
            { Nama: "John Doe", Username: "johndoe", Email: "john@example.com", "Nomor Telepon": "081234567890", Peran: "CONTRIBUTOR" },
            { Nama: "Jane Admin", Username: "janeadmin", Email: "jane@example.com", "Nomor Telepon": "081298765432", Peran: "ADMIN" },
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users Template");
        XLSX.writeFile(wb, "Poinkita_User_Template.xlsx");
    };

    const handleDeleteUser = async (user: User) => {
        const ok = await confirm({
            title: t.auth.deleteUserConfirm,
            message: `Account: ${user.name} (${user.username})`,
            variant: 'danger' as const,
            confirmLabel: t.common.delete,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            deleteUser(user.id);
            alert({ title: "Success", message: t.auth.userDeleted, variant: 'success' });
        }
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setEditUserData({
            name: user.name || '',
            username: user.username || '',
            password: user.password || '',
            email: user.email || '',
            phone: user.phone || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEditUser = () => {
        if (!editingUser) return;
        updateUser(editingUser.id, editUserData);
        setIsEditModalOpen(false);
        setEditingUser(null);
        alert({ title: "Success", message: t.auth.editUserSuccess, variant: 'success' });
    };

    const handleEnableBiometric = async () => {
        if (typeof window === 'undefined' || !window.PublicKeyCredential) {
            alert({ title: "Not Supported", message: "Biometric is not supported on this browser.", variant: 'info' });
            return;
        }

        try {
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                alert({ title: "Hardware Required", message: "Biometric hardware not found or not supported on this device.", variant: 'info' });
                return;
            }

            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // RP ID must match the domain exactly. Defaulting to window.location.hostname
            const rpId = window.location.hostname;

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: {
                        name: "Poinkita",
                        id: rpId
                    },
                    user: {
                        id: Uint8Array.from(currentUser?.id || 'user', c => c.charCodeAt(0)),
                        name: currentUser?.username || 'user',
                        displayName: currentUser?.name || 'User'
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" }, // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        userVerification: "required",
                        residentKey: "required",
                        requireResidentKey: true
                    },
                    timeout: 60000
                }
            }) as PublicKeyCredential;

            if (credential) {
                updateUser(currentUser!.id, {
                    biometricEnabled: true,
                    biometricId: credential.id
                });
                alert({ title: "Success", message: t.auth.biometricSuccess, variant: 'success' });
            }
        } catch (err) {
            console.error("Biometric registration error:", err);
            if ((err as any).name !== 'NotAllowedError') {
                alert({ title: "Error", message: t.auth.biometricFailed, variant: 'danger' });
            }
        }
    };

    const handleDisableBiometric = () => {
        updateUser(currentUser!.id, { biometricEnabled: false });
        alert({ title: "Removed", message: "Biometric login disabled.", variant: 'info' });
    };

    if (!currentUser) {
        return <div className="p-8 text-center text-gray-500">Please login to view settings.</div>;
    }

    const isAdmin = currentUser.role === 'ADMIN';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '0.6rem 0.75rem',
                            whiteSpace: 'nowrap' as const,
                            fontSize: '0.85rem',
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
                            padding: '0.6rem 0.75rem',
                            whiteSpace: 'nowrap' as const,
                            fontSize: '0.85rem',
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
                    <button
                        onClick={() => setActiveTab('manage')}
                        style={{
                            padding: '0.6rem 0.75rem',
                            whiteSpace: 'nowrap' as const,
                            fontSize: '0.85rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeTab === 'manage' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'manage' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: activeTab === 'manage' ? 'bold' : 'normal',
                            cursor: 'pointer'
                        }}
                    >
                        {t.auth.manageAccounts || 'Manage Accounts'}
                    </button>
                </div>
            )}

            {activeTab === 'profile' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.auth.name || 'Personal Information'}</CardTitle>
                        <CardDescription>Update your display name and contact credentials.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSaveProfile}>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
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

                            <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <h4 className="font-semibold text-lg">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</h4>
                                    <p className="text-sm text-gray-500">Switch between light and dark themes.</p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={toggleTheme}
                                    variant="secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {theme === 'light' ? <FaMoon /> : <FaSun />}
                                    {theme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'}
                                </Button>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <h4 className="font-semibold text-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaFingerprint /> {t.auth.biometricLogin}
                                    </h4>
                                    <p className="text-sm text-gray-500">{t.auth.biometricDesc}</p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={currentUser.biometricEnabled ? handleDisableBiometric : handleEnableBiometric}
                                    variant={currentUser.biometricEnabled ? "secondary" : "primary"}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {currentUser.biometricEnabled ? <FaCheckCircle /> : <FaFingerprint />}
                                    {currentUser.biometricEnabled ? t.auth.biometricSuccess.split(' ')[0] : t.auth.enableBiometric}
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter style={{ justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
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
            )}

            {activeTab === 'register' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.auth.registerTitle}</CardTitle>
                        <CardDescription>{t.auth.registerDesc}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
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

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleGenerateRandomPassword}
                                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                                >
                                    {t.auth.generateRandomPassword}
                                </Button>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {t.auth.randomPasswordDesc}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter style={{ justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <Button type="button" variant="secondary" onClick={downloadUserTemplate} className="flex items-center gap-2">
                                    <FaDownload /> {t.auth.importUserTemplate}
                                </Button>
                                <label style={{ display: 'inline-block' }}>
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleImportExcel}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text-main)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        height: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <FaFileExcel style={{ color: '#107c10' }} />
                                        {t.common.importExcel}
                                    </div>
                                </label>
                            </div>
                            <Button type="submit" isLoading={isRegisterLoading} className="flex items-center gap-2">
                                <FaUserPlus /> {t.auth.createAccount}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {activeTab === 'manage' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.auth.userList}</CardTitle>
                        <CardDescription>Manage contributor and admin accounts.</CardDescription>
                    </CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '500px' }}>
                                <thead style={{ background: 'var(--color-bg)', textAlign: 'left' }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>{t.auth.name}</th>
                                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>{t.auth.username}</th>
                                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>{t.auth.role}</th>
                                        <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>{t.common.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.id !== currentUser.id).map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{user.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email || '-'}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{user.username}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: user.role === 'ADMIN' ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                                                    color: user.role === 'ADMIN' ? 'var(--color-primary)' : 'inherit',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button variant="ghost" onClick={() => handleOpenEdit(user)} style={{ padding: '0.25rem' }}>
                                                        <FaEdit />
                                                    </Button>
                                                    <Button variant="ghost" onClick={() => handleDeleteUser(user)} style={{ padding: '0.25rem', color: 'var(--color-danger)' }}>
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={t.auth.editUser}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleSaveEditUser}>{t.common.save}</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1.25rem' }}>
                        <Input
                            label={t.auth.name}
                            value={editUserData.name}
                            onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                        />
                        <Input
                            label={t.auth.username}
                            value={editUserData.username}
                            onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1.25rem' }}>
                        <Input
                            label={t.auth.email}
                            value={editUserData.email}
                            onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                        />
                        <Input
                            label={t.auth.phone}
                            value={editUserData.phone}
                            onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                        />
                    </div>
                    <Input
                        label={t.auth.password}
                        type="password"
                        value={editUserData.password}
                        onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                    />
                </div>
            </Modal>
        </div>
    );
}
