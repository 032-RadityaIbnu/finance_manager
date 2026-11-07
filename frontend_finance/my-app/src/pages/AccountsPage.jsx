import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const ACCOUNT_TYPES = ['CASH', 'BANK', 'E-WALLET', 'E-MONEY'];
const typeIcon = { CASH: '💵', BANK: '🏦', 'E-WALLET': '📱', 'E-MONEY': '💳' };
const typeColor = { CASH: 'badge-yellow', BANK: 'badge-blue', 'E-WALLET': 'badge-purple', 'E-MONEY': 'badge-green' };

const emptyForm = { name: '', type: 'CASH', balance: '' };

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'add' | 'edit' | 'delete'
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const showAlert = (msg, type = 'success') => {
        setAlert({ msg, type });
        setTimeout(() => setAlert(null), 3000);
    };

    const openAdd = () => { setForm(emptyForm); setModal('add'); };
    const openEdit = (acc) => { setSelected(acc); setForm({ name: acc.name, type: acc.type, balance: acc.balance }); setModal('edit'); };
    const openDelete = (acc) => { setSelected(acc); setModal('delete'); };
    const closeModal = () => { setModal(null); setSelected(null); };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/accounts', { ...form, balance: parseFloat(form.balance) || 0 });
            showAlert('Rekening berhasil ditambahkan!');
            closeModal();
            fetchAccounts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Gagal menambahkan rekening.', 'error');
        } finally { setSaving(false); }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/accounts/${selected.id}`, { name: form.name, type: form.type });
            showAlert('Rekening berhasil diperbarui!');
            closeModal();
            fetchAccounts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Gagal memperbarui rekening.', 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.delete(`/accounts/${selected.id}`);
            showAlert('Rekening berhasil dihapus!');
            closeModal();
            fetchAccounts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Gagal menghapus rekening.', 'error');
        } finally { setSaving(false); }
    };

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Wallet</h1>
                    <p className="page-sub">Control your wallets and accounts</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} id="btn-add-account">
                    + Add Wallet
                </button>
            </div>

            {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

            {/* Total balance */}
            <div className="total-balance-card">
                <div className="total-label">Overall Wallet</div>
                <div className="total-value">{fmt(totalBalance)}</div>
            </div>

            {loading ? (
                <div className="page-loading"><span className="spinner spinner-lg"></span></div>
            ) : accounts.length === 0 ? (
                <div className="empty-state-large">
                    <div className="empty-icon">◈</div>
                    <p>Belum ada rekening. Tambahkan rekening pertama Anda!</p>
                    <button className="btn btn-primary" onClick={openAdd} id="btn-add-account-empty">+ Tambah Rekening</button>
                </div>
            ) : (
                <div className="accounts-grid">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="account-card">
                            <div className="account-card-top">
                                <div className="account-card-icon">{typeIcon[acc.type]}</div>
                                <span className={`badge ${typeColor[acc.type]}`}>{acc.type}</span>
                            </div>
                            <div className="account-card-name">{acc.name}</div>
                            <div className="account-card-balance">{fmt(acc.balance)}</div>
                            <div className="account-card-actions">
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => openEdit(acc)}
                                    id={`btn-edit-account-${acc.id}`}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => openDelete(acc)}
                                    id={`btn-delete-account-${acc.id}`}
                                >
                                    🗑 Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD MODAL */}
            {modal === 'add' && (
                <Modal title="Tambah Rekening Baru" onClose={closeModal}>
                    <form onSubmit={handleAdd} className="modal-form">
                        <div className="form-group">
                            <label className="form-label">Nama Rekening</label>
                            <input name="name" className="form-input" placeholder="cth: BCA Utama, GoPay" value={form.name} onChange={handleChange} required autoFocus />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tipe Rekening</label>
                            <select name="type" className="form-input" value={form.type} onChange={handleChange}>
                                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Saldo Awal (Rp)</label>
                            <input name="balance" type="number" min="0" className="form-input" placeholder="0" value={form.balance} onChange={handleChange} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={closeModal}>Batal</button>
                            <button type="submit" className="btn btn-primary" id="btn-save-account" disabled={saving}>
                                {saving ? <span className="spinner"></span> : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* EDIT MODAL */}
            {modal === 'edit' && (
                <Modal title="Edit Rekening" onClose={closeModal}>
                    <form onSubmit={handleEdit} className="modal-form">
                        <div className="form-group">
                            <label className="form-label">Nama Rekening</label>
                            <input name="name" className="form-input" value={form.name} onChange={handleChange} required autoFocus />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tipe Rekening</label>
                            <select name="type" className="form-input" value={form.type} onChange={handleChange}>
                                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <p className="form-note">💡 Saldo tidak dapat diubah langsung. Gunakan transaksi untuk menyesuaikan.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={closeModal}>Batal</button>
                            <button type="submit" className="btn btn-primary" id="btn-update-account" disabled={saving}>
                                {saving ? <span className="spinner"></span> : 'Perbarui'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* DELETE MODAL */}
            {modal === 'delete' && (
                <Modal title="Hapus Rekening" onClose={closeModal}>
                    <div className="delete-confirm">
                        <div className="delete-icon">⚠️</div>
                        <p>Yakin ingin menghapus rekening <strong>{selected?.name}</strong>?</p>
                        <p className="delete-warning">Semua transaksi terkait juga akan terhapus permanen!</p>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-outline" onClick={closeModal}>Batal</button>
                        <button className="btn btn-danger" id="btn-confirm-delete-account" onClick={handleDelete} disabled={saving}>
                            {saving ? <span className="spinner"></span> : 'Hapus Permanen'}
                        </button>
                    </div>
                </Modal>
            )}
        </Layout>
    );
}
