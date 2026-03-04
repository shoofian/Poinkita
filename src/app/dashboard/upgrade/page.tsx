'use client';

import React from 'react';
import styles from './page.module.css';
import { FaCheck, FaTimes, FaRocket, FaCrown, FaStar } from 'react-icons/fa';
import { useLanguage } from '@/lib/context/LanguageContext';

export default function UpgradePage() {
    const { t } = useLanguage();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t.upgrade.title}</h1>
                <p className={styles.subtitle}>
                    {t.upgrade.subtitle}
                </p>
            </div>

            <div className={styles.pricingGrid}>
                {/* Starter Plan */}
                <div className={`${styles.pricingCard} ${styles.cardStarter}`}>
                    <div className={styles.tierHeader}>
                        <div className={`${styles.tierIconWrapper} ${styles.iconStarter}`}>
                            <FaStar className={styles.tierIcon} />
                        </div>
                        <h2 className={styles.tierName}>{t.upgrade.starter}</h2>
                        <div className={styles.tierPrice}>
                            <span className={styles.currency}>Rp</span>
                            <span className={styles.amount}>0</span>
                            <span className={styles.period}>{t.upgrade.free}</span>
                        </div>
                        <p className={styles.tierDesc}>{t.upgrade.starterDesc}</p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.capacity}: <b>{t.upgrade.memberUpTo20}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.contributor}: <b>{t.upgrade.singleAdmin}</b></span>
                        </li>
                        <li>
                            <FaTimes className={styles.timesIcon} />
                            <span className={styles.disabledFeature}>{t.upgrade.evidence}</span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.reportArchive}: <b>{t.upgrade.onLandingPage}</b></span>
                        </li>
                        <li>
                            <FaTimes className={styles.timesIcon} />
                            <span className={styles.disabledFeature}>{t.upgrade.notification}</span>
                        </li>
                        <li>
                            <FaTimes className={styles.timesIcon} />
                            <span className={styles.disabledFeature}>{t.upgrade.appealFeature}</span>
                        </li>
                    </ul>
                    <button className={`${styles.actionBtn} ${styles.currentBtn}`} disabled>
                        {t.upgrade.currentPlan}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className={`${styles.pricingCard} ${styles.popularPlan} ${styles.cardPro}`}>
                    <div className={styles.popularBadge}>{t.upgrade.mostPopular}</div>
                    <div className={styles.tierHeader}>
                        <div className={`${styles.tierIconWrapper} ${styles.iconPro}`}>
                            <FaRocket className={styles.tierIcon} />
                        </div>
                        <h2 className={styles.tierName}>{t.upgrade.pro}</h2>
                        <div className={styles.tierPrice}>
                            <span className={styles.currency}>Rp</span>
                            <span className={styles.amount}>500</span>
                            <span className={styles.thousands}>{t.upgrade.thousands}</span>
                            <span className={styles.period}>{t.upgrade.perYear}</span>
                        </div>
                        <p className={styles.tierDesc}>{t.upgrade.proDesc}</p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.capacity}: <b>{t.upgrade.memberUpTo250}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.contributor}: <b>{t.upgrade.adminUpTo5}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.evidence}: <b>{t.upgrade.photoImage}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.reportArchive}: <b>{t.upgrade.exportExcel}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.notification}: <b>{t.upgrade.email}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.appealFeature}: <b>{t.upgrade.available}</b></span>
                        </li>
                    </ul>
                    <button className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                        {t.upgrade.upgradeNow}
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className={`${styles.pricingCard} ${styles.cardEnterprise}`}>
                    <div className={styles.tierHeader}>
                        <div className={`${styles.tierIconWrapper} ${styles.iconEnterprise}`}>
                            <FaCrown className={styles.tierIcon} />
                        </div>
                        <h2 className={styles.tierName}>{t.upgrade.enterprise}</h2>
                        <div className={styles.tierPrice}>
                            <span className={styles.currency}>Rp</span>
                            <span className={styles.amount}>1,3</span>
                            <span className={styles.thousands}>{t.upgrade.millions}</span>
                            <span className={styles.period}>{t.upgrade.perYear}</span>
                        </div>
                        <p className={styles.tierDesc}>{t.upgrade.enterpriseDesc}</p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.capacity}: <b>{t.upgrade.unlimited}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.contributor}: <b>{t.upgrade.unlimited}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.evidence}: <b>{t.upgrade.photoPdf}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.reportArchive}: <b>{t.upgrade.exportPdfPrint}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.notification}: <b>{t.upgrade.waGateway}</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>{t.upgrade.appealFeature}: <b>{t.upgrade.available}</b></span>
                        </li>
                    </ul>
                    <button className={`${styles.actionBtn} ${styles.enterpriseBtn}`}>
                        {t.upgrade.contactSales}
                    </button>
                </div>
            </div>

            <div className={styles.faqSection}>
                <h3 className={styles.faqTitle}>{t.upgrade.faqTitle}</h3>
                <p className={styles.faqDesc}>
                    {t.upgrade.faqDesc}
                </p>
                <button className={styles.contactBtn}>{t.upgrade.contactCs}</button>
            </div>
        </div>
    );
}
