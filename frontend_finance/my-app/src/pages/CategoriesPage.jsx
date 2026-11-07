import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// ✅ Label disesuaikan
const typeLabels = {
    'BANK': 'BCA, BNI, dll',
    'E-WALLET': 'Gopay, Shopeepay, dll',
    'E-MONEY': 'E-Money (Flazz, e-Toll, dll)',
    'CASH': 'Uang Tunai'
};

const typeIcons = {
    'BANK': '🏦',
    'E-WALLET': '📱',
    'E-MONEY': '💳',
    'CASH': '💵'
};

const typeColors = {
    'BANK': 'badge-blue',
    'E-WALLET': 'badge-purple',
    'E-MONEY': 'badge-green',
    'CASH': 'badge-yellow'
};

// Color palette untuk progress bar
const barColors = {
    'BANK': '#3b82f6',
    'E-WALLET': '#a855f7',
    'E-MONEY': '#10b981',
    'CASH': '#eab308'
};

export default function CategoriesPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const totalNetworth = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    const groupedAccounts = accounts.reduce((acc, current) => {
        if (!acc[current.type]) acc[current.type] = [];
        acc[current.type].push(current);
        return acc;
    }, {});

    const categories = Object.keys(typeLabels).map(key => {
        const items = groupedAccounts[key] || [];
        const subTotal = items.reduce((s, a) => s + parseFloat(a.balance), 0);
        const percentage = totalNetworth > 0 ? (subTotal / totalNetworth) * 100 : 0;
        
        return {
            type: key,
            label: typeLabels[key],
            icon: typeIcons[key],
            color: typeColors[key],
            barColor: barColors[key],
            items,
            subTotal,
            percentage
        };
    });

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Total Networth</h1>
                    <p className="page-sub">Summary of total net worth across all wallets and accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/accounts')} id="btn-goto-accounts">
                    + Kelola Rekening
                </button>
            </div>

            {loading ? (
                <div className="page-loading"><span className="spinner spinner-lg"></span></div>
            ) : (
                <>
                    {/* TOTAL NETWORTH CARD WITH BAR CHART */}
                    <div className="total-balance-card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: 'none', color: '#fff', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '2rem' }}>
                        <div className="total-label" style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Networth Keseluruhan</div>
                        <div className="total-value" style={{ color: '#f8fafc', fontSize: '3rem', marginTop: '0.5rem', fontWeight: '800' }}>{fmt(totalNetworth)}</div>
                        
                        {/* VISUAL PERCENTAGE BAR */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ height: '10px', width: '100%', backgroundColor: '#334155', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                                {categories.map(cat => cat.percentage > 0 && (
                                    <div 
                                        key={cat.type} 
                                        style={{ 
                                            width: `${cat.percentage}%`, 
                                            backgroundColor: cat.barColor,
                                            height: '100%',
                                            transition: 'width 0.5s ease'
                                        }}
                                        title={`${cat.label}: ${cat.percentage.toFixed(1)}%`}
                                    />
                                ))}
                            </div>
                            
                            {/* LEGEND BAR */}
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                {categories.map(cat => (
                                    <div key={cat.type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.barColor, display: 'inline-block' }}></span>
                                        <span>{cat.label}: <strong>{cat.percentage.toFixed(1)}%</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {categories.map((cat) => (
                            <div key={cat.type} className="category-networth-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontSize: '2.2rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' }}>{cat.icon}</div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{cat.label}</h3>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem', fontWeight: '500' }}>{cat.items.length} Aset Tercatat</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: '500' }}>Total {cat.label}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{fmt(cat.subTotal)}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', marginTop: '0.2rem' }}>{cat.percentage.toFixed(1)}% dari Total Networth</div>
                                    </div>
                                </div>

                                {cat.items.length === 0 ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        Belum ada data untuk kategori ini.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                        {cat.items.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span className={`badge ${cat.color}`} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: '600' }}>{item.type}</span>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '600', color: '#334155', fontSize: '1rem' }}>{item.name}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem' }}>{fmt(item.balance)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Layout>
    );
}