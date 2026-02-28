'use client';

import React from 'react';
import styles from './page.module.css';
import { FaCheck, FaTimes, FaRocket, FaCrown, FaStar } from 'react-icons/fa';

export default function UpgradePage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Pilih Paket Terbaik Untuk Sekolah Anda</h1>
                <p className={styles.subtitle}>
                    Tingkatkan pengalaman pengelolaan manajemen poin sekolah dengan fitur-fitur premium yang dirancang khusus untuk memenuhi kebutuhan skala kecil hingga besar.
                </p>
            </div>

            <div className={styles.pricingGrid}>
                {/* Starter Plan */}
                <div className={`${styles.pricingCard} ${styles.cardStarter}`}>
                    <div className={styles.tierHeader}>
                        <div className={`${styles.tierIconWrapper} ${styles.iconStarter}`}>
                            <FaStar className={styles.tierIcon} />
                        </div>
                        <h2 className={styles.tierName}>Starter</h2>
                        <div className={styles.tierPrice}>
                            <span className={styles.currency}>Rp</span>
                            <span className={styles.amount}>0</span>
                            <span className={styles.period}>/gratis</span>
                        </div>
                        <p className={styles.tierDesc}>Cocok untuk uji coba dan lingkup kecil.</p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Kapasitas: <b>Hingga 20 Member</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Kontributor: <b>Single Admin</b></span>
                        </li>
                        <li>
                            <FaTimes className={styles.timesIcon} />
                            <span className={styles.disabledFeature}>Bukti Transaksi</span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Laporan & Arsip: <b>Di Landing Page</b></span>
                        </li>
                        <li>
                            <FaTimes className={styles.timesIcon} />
                            <span className={styles.disabledFeature}>Notifikasi</span>
                        </li>
                        <li>
                            <FaTimes className={styles.timesIcon} />
                            <span className={styles.disabledFeature}>Fitur Banding</span>
                        </li>
                    </ul>
                    <button className={`${styles.actionBtn} ${styles.currentBtn}`} disabled>
                        Paket Saat Ini
                    </button>
                </div>

                {/* Pro Plan */}
                <div className={`${styles.pricingCard} ${styles.popularPlan} ${styles.cardPro}`}>
                    <div className={styles.popularBadge}>Paling Populer</div>
                    <div className={styles.tierHeader}>
                        <div className={`${styles.tierIconWrapper} ${styles.iconPro}`}>
                            <FaRocket className={styles.tierIcon} />
                        </div>
                        <h2 className={styles.tierName}>Pro</h2>
                        <div className={styles.tierPrice}>
                            <span className={styles.currency}>Rp</span>
                            <span className={styles.amount}>500</span>
                            <span className={styles.thousands}>rb</span>
                            <span className={styles.period}>/tahun</span>
                        </div>
                        <p className={styles.tierDesc}>Cocok untuk sekolah dengan jumlah siswa menengah.</p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Kapasitas: <b>Hingga 250 Member</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Kontributor: <b>Hingga 5 Admin</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Bukti Transaksi: <b>Foto/Gambar</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Laporan & Arsip: <b>Export Excel</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Notifikasi: <b>Email</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Fitur Banding: <b>Tersedia</b></span>
                        </li>
                    </ul>
                    <button className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                        Upgrade Sekarang
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className={`${styles.pricingCard} ${styles.cardEnterprise}`}>
                    <div className={styles.tierHeader}>
                        <div className={`${styles.tierIconWrapper} ${styles.iconEnterprise}`}>
                            <FaCrown className={styles.tierIcon} />
                        </div>
                        <h2 className={styles.tierName}>Enterprise</h2>
                        <div className={styles.tierPrice}>
                            <span className={styles.currency}>Rp</span>
                            <span className={styles.amount}>1,3</span>
                            <span className={styles.thousands}>jt</span>
                            <span className={styles.period}>/tahun</span>
                        </div>
                        <p className={styles.tierDesc}>Untuk sekolah besar dengan kebutuhan fitur lengkap.</p>
                    </div>
                    <ul className={styles.featureList}>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Kapasitas: <b>Unlimited</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Kontributor: <b>Unlimited</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Bukti Transaksi: <b>Foto & PDF</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Laporan & Arsip: <b>Excel, PDF, Cetak</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Notifikasi: <b>WhatsApp Gateway</b></span>
                        </li>
                        <li>
                            <FaCheck className={styles.checkIcon} />
                            <span>Fitur Banding: <b>Tersedia</b></span>
                        </li>
                    </ul>
                    <button className={`${styles.actionBtn} ${styles.enterpriseBtn}`}>
                        Hubungi Sales
                    </button>
                </div>
            </div>

            <div className={styles.faqSection}>
                <h3 className={styles.faqTitle}>Butuh Bantuan atau Kustomisasi?</h3>
                <p className={styles.faqDesc}>
                    Jika sekolah Anda membutuhkan fitur khusus yang tidak ada di daftar ini,
                    jangan ragu untuk menghubungi tim pemasaran kami untuk merancang solusi yang tepat.
                </p>
                <button className={styles.contactBtn}>Hubungi CS Kami</button>
            </div>
        </div>
    );
}
