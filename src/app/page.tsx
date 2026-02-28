'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  History,
  Users,
  Search,
  CheckCircle2,
  UserPlus,
  LogIn,
  Languages,
  CircleHelp,
  Moon,
  Sun,
  Zap,
  Lock,
  Mail,
  Fingerprint,
  Scale,
  MessageSquare,
  AlertCircle,
  Image as ImageIcon,
  Camera,
  Loader2,
  X,
  XCircle,
  Clock
} from 'lucide-react';
import styles from './page.module.css';
import { useTheme } from '@/lib/context/ThemeContext';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

function LandingContent() {
  const router = useRouter();
  // ... (omitting unchanged lines for brevity in thought process, but tool needs exact content for block)
  // I will use multi_replace to be precise.

  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const {
    users,
    currentUser,
    setCurrentUser,
    loginUser,
    isLoaded,
    registerUser,
    lookupMemberPublic,
    generateId,
    auditLogs,
    addAppeal,
    appeals,
    lookupLogsPublic,
    lookupAppealsPublic,
    lookupRulesPublic
  } = useStore();

  // Modals State
  const [activeModal, setActiveModal] = useState<'LOGIN' | 'REGISTER' | 'PRICING' | null>(null);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Point Checker State
  const [checkId, setCheckId] = useState('');
  const [checkDivision, setCheckDivision] = useState('');
  const [checkResult, setCheckResult] = useState<any | null>(null);
  const [checkError, setCheckError] = useState(false);
  const [memberLogs, setMemberLogs] = useState<any[]>([]);
  const [memberAppeals, setMemberAppeals] = useState<any[]>([]);

  // Appeal Modal State
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  // Rules Modal State
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [memberRules, setMemberRules] = useState<any[]>([]);

  // Image compression helper
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width *= maxWidth / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas context not available');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setAppealEvidence(compressed);
    } catch (err) {
      console.error('Compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Check Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard/transactions');
    }
  }, [currentUser, router]);

  // Refresh check results if appeals or logs change to show new statuses
  useEffect(() => {
    if (checkResult) {
      const updatedMember = lookupMemberPublic(checkId, checkDivision);
      if (updatedMember) {
        setCheckResult(updatedMember);
        const logs = lookupLogsPublic(updatedMember.id);
        setMemberLogs(logs);
        const apps = lookupAppealsPublic(updatedMember.id);
        setMemberAppeals(apps);
        const rules = lookupRulesPublic(updatedMember.adminId);
        setMemberRules(rules);
      }
    }
  }, [appeals, auditLogs]);

  // Handle Query Params for Auth Modals
  useEffect(() => {
    const authType = searchParams.get('auth');
    if (authType === 'login') {
      setActiveModal('LOGIN');
    } else if (authType === 'register') {
      setActiveModal('REGISTER');
    }
  }, [searchParams]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError('');

    setTimeout(() => {
      const result = loginUser(loginUsername, loginPassword);

      if (result.success) {
        // setCurrentUser is already called inside loginUser
        return;
      }

      if (result.error === 'DATA_NOT_LOADED') {
        setLoginError(t.auth.dataLoading || 'Data is still loading, please wait a moment and try again.');
      } else {
        setLoginError(t.auth.invalidCredentials);
      }
      setIsLoginLoading(false);
    }, 800);
  };

  const handleBiometricLogin = async () => {
    setLoginError('');
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setLoginError("Biometric authentication is not supported by your browser.");
      setActiveModal('LOGIN');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          timeout: 60000,
          userVerification: "required"
        }
      });

      if (assertion) {
        // Locate user by credential ID
        const matchedUser = users.find(u => u.biometricEnabled && u.biometricId === assertion.id);

        if (matchedUser) {
          setCurrentUser(matchedUser);
          // Redirect handled by useEffect
        } else {
          setLoginError(t.auth.biometricNotSet);
          setActiveModal('LOGIN');
        }
      }
    } catch (err: any) {
      console.error("Biometric login error:", err);
      // If it's a real failure (not cancellation), show feedback
      if (err.name === 'SecurityError') {
        setLoginError("Biometrics require a secure connection (HTTPS or localhost).");
      } else if (err.name !== 'NotAllowedError') {
        setLoginError(t.auth.biometricFailed);
      }

      if (err.name !== 'NotAllowedError') {
        setActiveModal('LOGIN');
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegLoading(true);
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError(t.auth.passwordsDoNotMatch);
      setIsRegLoading(false);
      return;
    }

    setTimeout(() => {
      const normalizedUsername = regUsername.trim().toLowerCase();
      const exists = users.find(u => u.username.toLowerCase() === normalizedUsername);

      if (exists) {
        setRegError(t.auth.usernameTaken);
        setIsRegLoading(false);
        return;
      }

      if (!USERNAME_REGEX.test(normalizedUsername)) {
        setRegError(t.auth.usernameInvalid);
        setIsRegLoading(false);
        return;
      }

      const newUser = {
        id: generateId('USR'),
        name: regName,
        username: normalizedUsername,
        email: regEmail,
        password: regPassword,
        role: 'ADMIN' as const
      };

      registerUser(newUser);
      setRegSuccess(true);
      setIsRegLoading(false);

      setTimeout(() => {
        setActiveModal('LOGIN');
        setRegSuccess(false);
        setLoginUsername(normalizedUsername);
        // Clear form
        setRegName('');
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      }, 2000);
    }, 800);
  };

  const handleCheckPoints = (e: React.FormEvent) => {
    e.preventDefault();
    const member = lookupMemberPublic(checkId, checkDivision);
    if (member) {
      setCheckResult(member);
      setCheckError(false);
      // Fetch logs for this member using public lookup
      const logs = lookupLogsPublic(member.id);
      setMemberLogs(logs);
      // Fetch appeals for this member using public lookup
      const appeals = lookupAppealsPublic(member.id);
      setMemberAppeals(appeals);
      // Fetch rules for this member's admin
      const rules = lookupRulesPublic(member.adminId);
      setMemberRules(rules);
    } else {
      setCheckResult(null);
      setCheckError(true);
      setMemberLogs([]);
      setMemberAppeals([]);
      setMemberRules([]);
    }
  };

  const handleAppealClick = (txId: string) => {
    setSelectedTransactionId(txId);
    setAppealReason('');
    setAppealEvidence(null);
    setAppealSuccess(false);
    setIsAppealModalOpen(true);
  };

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransactionId || !checkResult) return;

    addAppeal({
      transactionId: selectedTransactionId,
      memberId: checkResult.id,
      reason: appealReason,
      adminId: checkResult.adminId,
      evidence: appealEvidence || undefined
    });

    setAppealSuccess(true);
    setTimeout(() => {
      setIsAppealModalOpen(false);
      setAppealSuccess(false);
    }, 2000);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en');
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <motion.header
        className={styles.navbar}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className={styles.navLogo}>Poinkita</div>
        <div className={styles.navActions}>
          <Button variant="ghost" className={styles.langBtn} onClick={toggleLanguage}>
            <Languages size={18} />
            {language.toUpperCase()}
          </Button>
          <Button variant="ghost" className={styles.langBtn} onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          <Button variant="ghost" className={styles.pricingBtn} onClick={() => setActiveModal('PRICING')}>
            {t.landing.pricing || 'Pricing'}
          </Button>
          <Button variant="secondary" onClick={() => { setActiveModal('LOGIN'); setLoginError(''); }}>
            {t.landing.loginBtn}
          </Button>
          <Button variant="primary" onClick={() => { setActiveModal('REGISTER'); setRegError(''); setRegSuccess(false); }}>
            {t.landing.registerBtn}
          </Button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <motion.div
            className={styles.heroBadge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
          >
            <ShieldCheck size={16} /> {t.landing.heroTitle}
          </motion.div>
          <h1 className={styles.heroTitle}>
            {t.landing.heroSubtitle.split(' ').map((word, i, arr) => (
              <React.Fragment key={i}>
                {i === arr.length - 1 ? <span className={styles.heroTitleAccent}>{word}</span> : word}{' '}
              </React.Fragment>
            ))}
          </h1>
          <p className={styles.heroDesc}>
            {t.landing.heroDesc}
          </p>
          <div className={styles.heroCta}>
            <Button variant="primary" size="lg" className={styles.ctaPrimary} onClick={() => setActiveModal('REGISTER')}>
              <UserPlus size={20} /> {t.landing.registerBtn}
            </Button>
            <Button variant="secondary" size="lg" className={`${styles.ctaSecondary} ${styles.ctaBiometric}`} onClick={handleBiometricLogin}>
              <Fingerprint size={20} /> {t.auth.biometricLogin}
            </Button>
            <Button variant="ghost" size="lg" className={styles.ctaTertiary} onClick={() => {
              const checker = document.getElementById('point-checker');
              checker?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Search size={20} /> {t.landing.checkBtn}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <motion.div
          className={styles.featureCard}
          whileHover={{ y: -10 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
            <History size={24} />
          </div>
          <h3 className={styles.featureTitle}>{t.landing.feature1Title}</h3>
          <p className={styles.featureDesc}>{t.landing.feature1Desc}</p>
        </motion.div>
        <motion.div
          className={styles.featureCard}
          whileHover={{ y: -10 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
            <Zap size={24} />
          </div>
          <h3 className={styles.featureTitle}>{t.landing.feature2Title}</h3>
          <p className={styles.featureDesc}>{t.landing.feature2Desc}</p>
        </motion.div>
        <motion.div
          className={styles.featureCard}
          whileHover={{ y: -10 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className={`${styles.featureIcon} ${styles.featureIconPurple}`}>
            <Users size={24} />
          </div>
          <h3 className={styles.featureTitle}>{t.landing.feature3Title}</h3>
          <p className={styles.featureDesc}>{t.landing.feature3Desc}</p>
        </motion.div>
      </section>

      {/* Point Checker Section */}
      <section id="point-checker" className={styles.checkerSection}>
        <motion.div
          className={styles.checkerCard}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.checkerTitle}>{t.landing.checkerTitle}</h2>
          <p className={styles.checkerDesc}>{t.landing.checkerDesc}</p>
          <form className={styles.checkerForm} onSubmit={handleCheckPoints}>
            <Input
              label={t.landing.memberId}
              placeholder="e.g. MEM-20260210-001"
              required
              value={checkId}
              onChange={(e) => setCheckId(e.target.value)}
              icon={<ShieldCheck size={18} />}
            />
            <Input
              label={t.landing.division}
              placeholder="e.g. Class 10A"
              required
              value={checkDivision}
              onChange={(e) => setCheckDivision(e.target.value)}
              icon={<Users size={18} />}
            />
            <Button type="submit" variant="primary" className="w-full">
              <Search size={18} /> {t.landing.checkBtn}
            </Button>
          </form>

          <AnimatePresence>
            {checkResult && (
              <motion.div
                className={styles.checkerResult}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className={styles.resultGrid}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>{t.landing.resultName}</span>
                    <span className={styles.resultValue}>{checkResult.name}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>{t.landing.resultDivision}</span>
                    <span className={styles.resultValue}>{checkResult.division}</span>
                  </div>
                  <div className={styles.resultPoints}>
                    <span className={styles.resultLabel}>{t.landing.resultPoints}</span>
                    <div className={`${styles.resultPointsValue} ${checkResult.totalPoints >= 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                      {checkResult.totalPoints} {t.transactions.pts}
                    </div>
                  </div>
                  <div className={styles.resultActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRulesModalOpen(true)}
                      className={styles.viewRulesBtn}
                    >
                      <ShieldCheck size={16} /> {t.landing.viewRules}
                    </Button>
                  </div>
                </div>

                {memberLogs.length > 0 && (
                  <div className={styles.publicHistory}>
                    <h4 className={styles.historyTitle}>
                      <History size={16} /> {t.members.historyTitle}
                    </h4>
                    <div className={styles.historyList}>
                      {memberLogs.map(log => {
                        const hasAppeal = memberAppeals.some(a => a.transactionId === log.id || (log.transactionId && a.transactionId === log.transactionId));
                        return (
                          <div key={log.id} className={`${styles.historyItem} ${log.action === 'DELETE' ? styles.historyItemDeleted : ''}`}>
                            <div className={styles.historyMain}>
                              <div className={styles.historyMeta}>
                                <span className={styles.historyDate}>{new Date(log.timestamp).toLocaleDateString()}</span>
                                <span className={styles.historyContributor}>
                                  • {t.members.changedBy} {users.find(u => u.id === log.contributorId)?.name || 'Admin'}
                                </span>
                              </div>
                              <span className={styles.historyDetails}>{log.details}</span>
                            </div>
                            <div className={styles.historySide}>
                              <span className={`${styles.historyPoints} ${log.action === 'DELETE' ? styles.pointsNeutral : (log.points >= 0 ? styles.pointsPositive : styles.pointsNegative)}`}>
                                {log.points >= 0 ? '+' : ''}{log.points}
                              </span>
                              {!hasAppeal && (
                                <button
                                  className={styles.appealBtn}
                                  onClick={() => handleAppealClick(log.transactionId || log.id)}
                                  title={t.transactions.appeal}
                                >
                                  <Scale size={14} />
                                </button>
                              )}
                              {hasAppeal && (() => {
                                const appeal = memberAppeals.find(a => a.transactionId === log.id || (log.transactionId && a.transactionId === log.transactionId));
                                if (appeal?.status === 'APPROVED') {
                                  return (
                                    <span className={`${styles.appealBadge} ${styles.appealApproved}`} title={t.transactions.approved}>
                                      <CheckCircle2 size={14} />
                                    </span>
                                  );
                                }
                                if (appeal?.status === 'REJECTED') {
                                  return (
                                    <span className={`${styles.appealBadge} ${styles.appealRejected}`} title={t.transactions.rejected}>
                                      <XCircle size={14} />
                                    </span>
                                  );
                                }
                                return (
                                  <span className={styles.appealBadge} title={t.transactions.pending}>
                                    <Clock size={14} />
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {checkError && (
            <motion.div
              className={styles.checkerNotFound}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {t.landing.notFound}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Poinkita • {t.landing.heroSubtitle}</p>
      </footer>

      {/* Login Modal */}
      <Modal
        isOpen={activeModal === 'LOGIN'}
        onClose={() => setActiveModal(null)}
        title={t.auth.loginTitle}
      >
        <form onSubmit={handleLogin} className={styles.formBody}>
          {loginError && <div className={styles.formError}>{loginError}</div>}
          <Input
            label={t.auth.username}
            placeholder="admin"
            required
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            icon={<Users size={18} />}
          />
          <Input
            type="password"
            label={t.auth.password}
            placeholder="••••••••"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            icon={<Lock size={18} />}
          />
          <Button type="submit" variant="primary" isLoading={isLoginLoading} disabled={!isLoaded} className="w-full">
            <LogIn size={18} /> {!isLoaded ? (t.auth.dataLoading || 'Loading...') : t.auth.signIn}
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleBiometricLogin}
            disabled={!isLoaded}
          >
            <Fingerprint size={18} /> {t.auth.biometricLogin}
          </Button>
          <div className={styles.formLink}>
            {t.auth.alreadyHaveAccount ? "" : t.landing.registerBtn}
            <button type="button" className={styles.formLinkBtn} onClick={() => setActiveModal('REGISTER')}>
              {t.auth.createAccount}
            </button>
          </div>
          <div className={styles.helpSection}>
            <button
              type="button"
              className={styles.helpBtn}
              onClick={() => window.open('https://api.whatsapp.com/send?phone=6285157544004', '_blank')}
            >
              <CircleHelp size={14} /> {t.auth.needHelp}
            </button>
          </div>
        </form>
      </Modal>

      {/* Register Modal */}
      <Modal
        isOpen={activeModal === 'REGISTER'}
        onClose={() => setActiveModal(null)}
        title={t.auth.registerTitle}
      >
        <form onSubmit={handleRegister} className={styles.formBody}>
          {regError && <div className={styles.formError}>{regError}</div>}
          {regSuccess && <div className={styles.formSuccess}><CheckCircle2 size={18} /> {t.auth.accountCreated}</div>}

          <Input
            label={t.auth.name}
            placeholder="Full Name"
            required
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            disabled={regSuccess}
            icon={<Users size={18} />}
          />
          <Input
            label={t.auth.username}
            placeholder="username"
            required
            value={regUsername}
            onChange={(e) => setRegUsername(e.target.value)}
            disabled={regSuccess}
            icon={<Users size={18} />}
          />
          <Input
            type="email"
            label={t.auth.email}
            placeholder="yourname@example.com"
            required
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            disabled={regSuccess}
            icon={<Mail size={18} />}
          />
          <Input
            type="password"
            label={t.auth.password}
            placeholder="••••••••"
            required
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            disabled={regSuccess}
            icon={<Lock size={18} />}
          />
          <Input
            type="password"
            label={t.auth.confirmPassword}
            placeholder="••••••••"
            required
            value={regConfirmPassword}
            onChange={(e) => setRegConfirmPassword(e.target.value)}
            disabled={regSuccess}
            icon={<Lock size={18} />}
          />
          <Button type="submit" variant="primary" isLoading={isRegLoading} disabled={regSuccess || !isLoaded} className="w-full">
            <UserPlus size={18} /> {!isLoaded ? (t.auth.dataLoading || 'Loading...') : t.auth.createAccount}
          </Button>
          <div className={styles.formLink}>
            {t.auth.alreadyHaveAccount}
            <button type="button" className={styles.formLinkBtn} onClick={() => setActiveModal('LOGIN')}>
              {t.auth.signIn}
            </button>
          </div>
        </form>
      </Modal>

      {/* Appeal Modal */}
      <Modal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        title={t.transactions.appealTitle}
      >
        <form onSubmit={handleAppealSubmit} className={styles.formBody}>
          {appealSuccess && (
            <div className={styles.formSuccess}>
              <CheckCircle2 size={18} /> {t.transactions.appealSuccess}
            </div>
          )}
          <div className={styles.appealInfo}>
            <MessageSquare size={20} />
            <p>{t.transactions.appealReason}</p>
          </div>
          <textarea
            className={styles.appealTextArea}
            placeholder="..."
            required
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            disabled={appealSuccess}
            rows={4}
          />

          <div className={styles.evidenceSection}>
            <label className={styles.evidenceLabel}>
              <ImageIcon size={16} /> {t.transactions.evidence || 'Evidence (Optional)'}
            </label>

            {isCompressing ? (
              <div className={styles.compressingStatus}>
                <Loader2 size={20} className={styles.compressingIcon} />
                <span>{t.transactions.compressing || 'Compressing photo...'}</span>
              </div>
            ) : appealEvidence ? (
              <div className={styles.previewContainer}>
                <img src={appealEvidence} alt="Evidence Preview" className={styles.previewImage} />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setAppealEvidence(null)}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className={styles.uploadBox}>
                <Camera size={24} />
                <p>{t.transactions.uploadLabel}</p>
                <span>{t.transactions.uploadHint}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <Button type="submit" variant="primary" isLoading={appealSuccess || isCompressing} disabled={appealSuccess || isCompressing} className="w-full">
            <Scale size={18} /> {t.transactions.submitAppeal}
          </Button>
        </form>
      </Modal>

      {/* Rules Modal */}
      <Modal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title={t.rules.title}
      >
        <div className={styles.rulesList}>
          {memberRules.length > 0 ? (
            memberRules.map(rule => (
              <div key={rule.id} className={styles.ruleItem}>
                <div className={styles.ruleHeader}>
                  <div className={styles.ruleContent}>
                    <span className={styles.ruleCode}>{rule.id}</span>
                    <span className={styles.ruleName}>{rule.description}</span>
                  </div>
                  <span className={`${styles.ruleBadge} ${rule.points >= 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                    {rule.points >= 0 ? '+' : ''}{rule.points} {t.transactions.pts}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>{t.rules.noRules || 'No rules available.'}</div>
          )}
        </div>
      </Modal>
      {/* Pricing Modal */}
      <Modal
        isOpen={activeModal === 'PRICING'}
        onClose={() => setActiveModal(null)}
        title={t.landing.pricing || 'Pricing'}
        maxWidth="1000px"
      >
        <div className={styles.pricingModalContent}>
          <div className={styles.pricingGrid}>
            {/* Starter Plan */}
            <div className={`${styles.pricingCard} ${styles.cardStarter}`}>
              <div className={styles.tierHeader}>
                <div className={`${styles.tierIconWrapper} ${styles.iconStarter}`}>
                  <ShieldCheck size={28} className={styles.tierIcon} />
                </div>
                <h3 className={styles.tierName}>Starter</h3>
                <div className={styles.tierPrice}>
                  <span className={styles.currency}>Rp</span>
                  <span className={styles.amount}>0</span>
                  <span className={styles.period}>/gratis</span>
                </div>
              </div>
              <ul className={styles.featureList}>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Kapasitas: <b>Hingga 20 Member</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Kontributor: <b>Single Admin</b></span></li>
                <li><XCircle size={16} className={styles.timesIcon} /><span className={styles.disabledFeature}>Bukti Transaksi</span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Laporan & Arsip: <b>Di Landing Page</b></span></li>
                <li><XCircle size={16} className={styles.timesIcon} /><span className={styles.disabledFeature}>Notifikasi</span></li>
                <li><XCircle size={16} className={styles.timesIcon} /><span className={styles.disabledFeature}>Fitur Banding</span></li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className={`${styles.pricingCard} ${styles.popularPlan} ${styles.cardPro}`}>
              <div className={styles.popularBadge}>Populer</div>
              <div className={styles.tierHeader}>
                <div className={`${styles.tierIconWrapper} ${styles.iconPro}`}>
                  <Zap size={28} className={styles.tierIcon} />
                </div>
                <h3 className={styles.tierName}>Pro</h3>
                <div className={styles.tierPrice}>
                  <span className={styles.currency}>Rp</span>
                  <span className={styles.amount}>500</span>
                  <span className={styles.thousands}>rb</span>
                  <span className={styles.period}>/tahun</span>
                </div>
              </div>
              <ul className={styles.featureList}>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Kapasitas: <b>Hingga 250 Member</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Kontributor: <b>Hingga 5 Admin</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Bukti Transaksi: <b>Foto/Gambar</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Laporan & Arsip: <b>Export Excel</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Notifikasi: <b>Email</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Fitur Banding: <b>Tersedia</b></span></li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className={`${styles.pricingCard} ${styles.cardEnterprise}`}>
              <div className={styles.tierHeader}>
                <div className={`${styles.tierIconWrapper} ${styles.iconEnterprise}`}>
                  <Users size={28} className={styles.tierIcon} />
                </div>
                <h3 className={styles.tierName}>Enterprise</h3>
                <div className={styles.tierPrice}>
                  <span className={styles.currency}>Rp</span>
                  <span className={styles.amount}>1,3</span>
                  <span className={styles.thousands}>jt</span>
                  <span className={styles.period}>/tahun</span>
                </div>
              </div>
              <ul className={styles.featureList}>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Kapasitas: <b>Unlimited</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Kontributor: <b>Unlimited</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Bukti Transaksi: <b>Foto & PDF</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Laporan & Arsip: <b>Excel, PDF, Cetak</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Notifikasi: <b>WhatsApp Gateway</b></span></li>
                <li><CheckCircle2 size={16} className={styles.checkIcon} /><span>Fitur Banding: <b>Tersedia</b></span></li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className={styles.loadingScreen}>Loading...</div>}>
      <LandingContent />
    </Suspense>
  );
}
