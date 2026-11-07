import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';

const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ✅ STATE UNTUK ALERT NOTIFIKASI
    const [alertMsg, setAlertMsg] = useState(null);

    useEffect(() => {
        // ✅ CEK FLAG DARI SESSIONSTORAGE
        const isJustLoggedIn = sessionStorage.getItem('just_logged_in');
        if (isJustLoggedIn) {
            // Gunakan user?.username atau user?.name
            const displayName = user?.username || user?.name || 'Pengguna';
            setAlertMsg(`Selamat datang kembali, ${displayName}! 👋`);
            
            // Hapus flag agar notifikasi tidak muncul lagi saat di-refresh
            sessionStorage.removeItem('just_logged_in');

            // Notifikasi otomatis hilang setelah 4 detik
            setTimeout(() => setAlertMsg(null), 4000);
        }

        const fetchData = async () => {
            try {
                const [accRes, txRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/transactions?limit=8'),
                ]);
                setAccounts(accRes.data);
                setTransactions(txRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
    const totalIncome = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpense = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    const accountTypeIcon = { CASH: '💵', BANK: '🏦', 'E-WALLET': '📱', 'E-MONEY': '💳' };

    if (loading) return (
        <Layout>
            <div className="page-loading"><span className="spinner spinner-lg"></span></div>
        </Layout>
    );

    return (
        <Layout>
            {/* ✅ BANNER NOTIFIKASI */}
            {alertMsg && <div className="alert alert-success mb-4">{alertMsg}</div>}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-sub">Where every wallet and transaction recorded</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card--blue">
                    <div className="stat-icon">◈</div>
                    <div className="stat-label">Total Saldo</div>
                    <div className="stat-value">{fmt(totalBalance)}</div>
                    <div className="stat-sub">{accounts.length} Wallet aktif</div>
                </div>
                <div className="stat-card stat-card--green">
                    <div className="stat-icon">↑</div>
                    <div className="stat-label">Pemasukan (8 terakhir)</div>
                    <div className="stat-value stat-value--green">{fmt(totalIncome)}</div>
                    <div className="stat-sub">dari {transactions.filter(t => t.type === 'INCOME').length} transaksi</div>
                </div>
                <div className="stat-card stat-card--red">
                    <div className="stat-icon">↓</div>
                    <div className="stat-label">Pengeluaran (8 terakhir)</div>
                    <div className="stat-value stat-value--red">{fmt(totalExpense)}</div>
                    <div className="stat-sub">dari {transactions.filter(t => t.type === 'EXPENSE').length} transaksi</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Accounts */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Wallet Saya</h2>
                        <Link to="/accounts" className="card-action" id="link-all-accounts">Lihat semua →</Link>
                    </div>
                    {accounts.length === 0 ? (
                        <div className="empty-state">
                            <p>Belum ada rekening.</p>
                            <Link to="/accounts" className="btn btn-outline btn-sm" id="btn-create-account-dash">+ Tambah Rekening</Link>
                        </div>
                    ) : (
                        <div className="account-list">
                            {accounts.slice(0, 5).map((acc) => (
                                <div key={acc.id} className="account-item">
                                    <div className="account-icon">{accountTypeIcon[acc.type] || '💰'}</div>
                                    <div className="account-info">
                                        <div className="account-name">{acc.name}</div>
                                        <div className="account-type">{acc.type}</div>
                                    </div>
                                    <div className="account-balance">{fmt(acc.balance)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Transaksi Terbaru</h2>
                        <Link to="/transactions" className="card-action" id="link-all-transactions">Lihat semua →</Link>
                    </div>
                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <p>Belum ada transaksi.</p>
                            <Link to="/transactions" className="btn btn-outline btn-sm" id="btn-create-tx-dash">+ Catat Transaksi</Link>
                        </div>
                    ) : (
                        <div className="tx-list">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="tx-item">
                                    <div className={`tx-type-dot ${tx.type === 'INCOME' ? 'dot-green' : 'dot-red'}`}></div>
                                    <div className="tx-info">
                                        <div className="tx-desc">{tx.description || tx.category_name || '—'}</div>
                                        <div className="tx-meta">{tx.account_name} · {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                                    </div>
                                    <div className={`tx-amount ${tx.type === 'INCOME' ? 'amount-green' : 'amount-red'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}