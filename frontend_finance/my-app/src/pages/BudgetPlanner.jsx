import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function BudgetPlanner() {
    const [bills, setBills] = useState([]);
    const [overview, setOverview] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const [newBill, setNewBill] = useState({
        title: '', amount: '', due_date: '', category_id: '', recurring: 'none',
    });

    const [limitDraft, setLimitDraft] = useState({});

    const showAlert = (msg, type = 'success') => {
        setAlert({ msg, type });
        setTimeout(() => setAlert(null), 3000);
    };

    const loadAll = async () => {
        try {
            const [billsRes, overviewRes, categoriesRes] = await Promise.all([
                api.get('/budget/bills'),
                api.get('/budget/overview'),
                api.get('/categories'),
            ]);
            setBills(billsRes.data);
            setOverview(overviewRes.data);
            setCategories(categoriesRes.data);
        } catch (err) {
            console.error('Gagal memuat data budget:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const handleAddBill = async (e) => {
        e.preventDefault();
        if (!newBill.title || !newBill.amount || !newBill.due_date) return;
        setSaving(true);
        try {
            await api.post('/budget/bills', { ...newBill, category_id: newBill.category_id || null });
            setNewBill({ title: '', amount: '', due_date: '', category_id: '', recurring: 'none' });
            showAlert('Tagihan berhasil ditambahkan!');
            loadAll();
        } catch (err) {
            showAlert('Gagal menambah tagihan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const togglePaid = async (bill) => {
        try {
            await api.put(`/budget/bills/${bill.id}`, { is_paid: bill.is_paid ? 0 : 1 });
            setBills((prev) => prev.map((b) => (b.id === bill.id ? { ...b, is_paid: b.is_paid ? 0 : 1 } : b)));
            showAlert(bill.is_paid ? 'Status tagihan diubah menjadi belum dibayar' : 'Tagihan ditandai lunas!');
        } catch (err) {
            showAlert('Gagal update status tagihan.', 'error');
        }
    };

    const deleteBill = async (id) => {
        try {
            await api.delete(`/budget/bills/${id}`);
            setBills((prev) => prev.filter((b) => b.id !== id));
            showAlert('Tagihan berhasil dihapus!');
        } catch (err) {
            showAlert('Gagal menghapus tagihan.', 'error');
        }
    };

    const saveLimit = async (category_id) => {
        const monthly_limit = limitDraft[category_id];
        if (monthly_limit === undefined || monthly_limit === '') return;
        try {
            await api.post('/budget/limits', { category_id, monthly_limit });
            showAlert('Limit budget berhasil diperbarui!');
            loadAll();
        } catch (err) {
            showAlert('Gagal menyimpan limit.', 'error');
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Budget Planner</h1>
                    <p className="page-sub">Plan your budget, track spending, and achieve your financial goals.cd </p>
                </div>
            </div>

            {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

            {loading ? (
                <div className="page-loading"><span className="spinner spinner-lg"></span></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* SECTION 1: JADWAL TAGIHAN */}
                    <div className="card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="card-title">Jadwal Tagihan</h2>
                        </div>

                        {/* Form Tambah Tagihan */}
                        <form onSubmit={handleAddBill} className="modal-form" style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Nama Tagihan</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="cth: Listrik PLN, WiFi, Netflix"
                                        value={newBill.title}
                                        onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Jumlah (Rp)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="150000"
                                        value={newBill.amount}
                                        onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Jatuh Tempo</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newBill.due_date}
                                        onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kategori</label>
                                    <select
                                        className="form-input"
                                        value={newBill.category_id}
                                        onChange={(e) => setNewBill({ ...newBill, category_id: e.target.value })}
                                    >
                                        <option value="">Tanpa Kategori</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Pengulangan</label>
                                    <select
                                        className="form-input"
                                        value={newBill.recurring}
                                        onChange={(e) => setNewBill({ ...newBill, recurring: e.target.value })}
                                    >
                                        <option value="none">Sekali</option>
                                        <option value="weekly">Mingguan</option>
                                        <option value="monthly">Bulanan</option>
                                        <option value="yearly">Tahunan</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <span className="spinner"></span> : '+ Tambah Tagihan'}
                                </button>
                            </div>
                        </form>

                        {/* Daftar Tagihan */}
                        {bills.length === 0 ? (
                            <div className="empty-state">
                                <p>Belum ada jadwal tagihan.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {bills.map((bill) => (
                                    <div
                                        key={bill.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justify: 'space-between',
                                            padding: '1rem 1.25rem',
                                            background: bill.is_paid ? '#f8fafc' : '#ffffff',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            opacity: bill.is_paid ? 0.65 : 1
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input
                                                type="checkbox"
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                checked={!!bill.is_paid}
                                                onChange={() => togglePaid(bill)}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#0f172a', textDecoration: bill.is_paid ? 'line-through' : 'none' }}>
                                                    {bill.title}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                    {formatRupiah(bill.amount)} · Jatuh tempo: {bill.due_date?.slice(0, 10)}
                                                    {bill.category_name ? ` · ${bill.category_name}` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-danger btn-xs"
                                            onClick={() => deleteBill(bill.id)}
                                            title="Hapus Tagihan"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: ALOKASI BUDGET PER KATEGORI */}
                    <div className="card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="card-title">📊 Alokasi Budget per Kategori</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {overview.length === 0 ? (
                                <div className="empty-state">
                                    <p>Belum ada kategori yang dikonfigurasi.</p>
                                </div>
                            ) : (
                                overview.map((cat) => {
                                    const pct = cat.monthly_limit > 0
                                        ? Math.min(100, Math.round((cat.spent / cat.monthly_limit) * 100))
                                        : 0;
                                    const over = cat.monthly_limit > 0 && cat.spent > cat.monthly_limit;

                                    return (
                                        <div key={cat.category_id} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{cat.category_name}</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: over ? '#ef4444' : '#64748b' }}>
                                                    {formatRupiah(cat.spent)} / {formatRupiah(cat.monthly_limit)}
                                                </span>
                                            </div>

                                            {/* Progress Bar Track */}
                                            <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                                <div
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: over ? '#ef4444' : '#3b82f6',
                                                        height: '100%',
                                                        transition: 'width 0.4s ease'
                                                    }}
                                                />
                                            </div>

                                            {/* Limit Editor Input Inline */}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    className="form-input form-input--sm"
                                                    placeholder="Set limit bulanan (Rp)"
                                                    style={{ maxWidth: '220px' }}
                                                    value={limitDraft[cat.category_id] ?? ''}
                                                    onChange={(e) => setLimitDraft({ ...limitDraft, [cat.category_id]: e.target.value })}
                                                />
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => saveLimit(cat.category_id)}
                                                >
                                                    Simpan Limit
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            )}
        </Layout>
    );
}