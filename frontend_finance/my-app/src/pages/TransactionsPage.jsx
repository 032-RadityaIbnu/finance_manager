import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

// Format Rupiah
const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// Format Tanggal (YYYY-MM-DD)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dateString.split('T')[0];
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State Transaksi (Income / Expense)
  const [txForm, setTxForm] = useState({
    accountId: '',
    categoryId: '',
    type: 'EXPENSE',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Form State Transfer
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [resTx, resAcc, resCat] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setTransactions(resTx.data);
      setAccounts(resAcc.data);
      setCategories(resCat.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Submit Transaksi Baru
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        account_id: txForm.accountId,
        category_id: txForm.categoryId || null,
        type: txForm.type,
        amount: Number(txForm.amount),
        description: txForm.description,
        date: txForm.date
      });
      setShowTxModal(false);
      setTxForm({
        accountId: '',
        categoryId: '',
        type: 'EXPENSE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Submit Transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      alert('Akun asal dan tujuan tidak boleh sama!');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transactions/transfer', {
        from_account_id: transferForm.fromAccountId,
        to_account_id: transferForm.toAccountId,
        amount: Number(transferForm.amount),
        description: transferForm.description,
        date: transferForm.date
      });

      setShowTransferModal(false);
      setTransferForm({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal melakukan transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ Handle Delete Transaksi / Transfer
  const handleDelete = async (tx) => {
    const isTransfer = tx.source_type === 'TRANSFER' || tx.type === 'TRANSFER';
    const itemLabel = isTransfer ? 'transfer' : 'transaksi';

    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${itemLabel} ini?`)) {
      return;
    }

    try {
      // Menyesuaikan endpoint API jika tipe hapusnya transfer
      const endpoint = isTransfer ? `/transactions/transfer/${tx.id}` : `/transactions/${tx.id}`;
      await api.delete(endpoint);
      fetchData(); // Refresh list setelah delete
    } catch (err) {
      alert(err.response?.data?.message || `Gagal menghapus ${itemLabel}`);
    }
  };

  return (
    <Layout>
      {/* Header dengan Tombol Aksi */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">Keep track of every income and expense in one place.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowTransferModal(true)}>
            🔄 Transfer
          </button>
          <button className="btn btn-primary" onClick={() => setShowTxModal(true)}>
            + Add Transaction
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <span className="spinner spinner-lg"></span>
        </div>
      ) : (
        <div className="transactions-container">
          {/* --- TAMPILAN DESKTOP --- */}
          <div className="desktop-only-table">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori / Akun</th>
                  <th>Tipe</th>
                  <th style={{ textAlign: 'right' }}>Jumlah</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={`${tx.source_type || 'TX'}-${tx.id}`}>
                      <td>{formatDate(tx.date)}</td>
                      <td className="tx-desc">{tx.description}</td>
                      <td>{tx.category_name || tx.category?.name || tx.category || tx.account_name || tx.accountName || '-'}</td>
                      <td>
                        <span className={`badge ${
                          tx.type === 'INCOME' ? 'badge-green' : 
                          tx.type === 'EXPENSE' ? 'badge-red' : 
                          'badge-blue'
                        }`}>
                          {tx.type === 'INCOME' ? 'Pemasukan' : tx.type === 'EXPENSE' ? 'Pengeluaran' : 'Transfer'}
                        </span>
                      </td>
                      <td 
                        style={{ textAlign: 'right' }} 
                        className={`tx-amount ${
                          tx.type === 'INCOME' ? 'income' : 
                          tx.type === 'EXPENSE' ? 'expense' : 
                          'transfer'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '🔄 '}
                        {fmt(tx.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-icon-delete"
                          onClick={() => handleDelete(tx)}
                          title="Hapus"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            fontSize: '1rem',
                            padding: '4px'
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- TAMPILAN MOBILE --- */}
          <div className="mobile-only-cards">
            {transactions.length === 0 ? (
              <div className="empty-state">Belum ada transaksi.</div>
            ) : (
              transactions.map((tx) => (
                <div key={`${tx.source_type || 'TX'}-${tx.id}`} className="tx-card">
                  <div className="tx-card-header">
                    <span className="tx-date">{formatDate(tx.date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${
                        tx.type === 'INCOME' ? 'badge-green' : 
                        tx.type === 'EXPENSE' ? 'badge-red' : 
                        'badge-blue'
                      }`}>
                        {tx.type === 'INCOME' ? 'Pemasukan' : tx.type === 'EXPENSE' ? 'Pengeluaran' : 'Transfer'}
                      </span>
                      <button 
                        onClick={() => handleDelete(tx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="tx-card-body">
                    <div className="tx-info">
                      <span className="tx-title">{tx.description}</span>
                      <span className="tx-subtitle">{tx.category_name || tx.category?.name || tx.account_name || 'Umum'}</span>
                    </div>
                    <div className={`tx-amount ${
                      tx.type === 'INCOME' ? 'income' : 
                      tx.type === 'EXPENSE' ? 'expense' : 
                      'transfer'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '🔄 '}
                      {fmt(tx.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL ADD TRANSACTION ================= */}
      {showTxModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Tambah Transaksi</h3>
              <button className="modal-close" onClick={() => setShowTxModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTxSubmit} className="modal-body">
              {/* Tipe Transaksi */}
              <div className="form-group">
                <label className="form-label">Tipe Transaksi</label>
                <div className="radio-group">
                  <label className={`radio-option ${txForm.type === 'EXPENSE' ? 'radio-active-red' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="EXPENSE"
                      checked={txForm.type === 'EXPENSE'}
                      onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                    />
                    🔴 Pengeluaran
                  </label>
                  <label className={`radio-option ${txForm.type === 'INCOME' ? 'radio-active-green' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="INCOME"
                      checked={txForm.type === 'INCOME'}
                      onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                    />
                    🟢 Pemasukan
                  </label>
                </div>
              </div>

              {/* Akun & Jumlah */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Akun</label>
                  <select
                    className="form-input"
                    value={txForm.accountId}
                    onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Akun --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Kategori & Tanggal */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={txForm.categoryId}
                    onChange={(e) => setTxForm({ ...txForm, categoryId: e.target.value })}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories
                      .filter((c) => c.type === txForm.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input
                    type="date"
                    className="form-input"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Misal: Beli Kopi, Gaji Bulanan"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowTxModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TRANSFER ================= */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Transfer Antar Akun</h3>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Dari Akun</label>
                  <select
                    className="form-input"
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    required
                  >
                    <option value="">-- Dari --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ke Akun</label>
                  <select
                    className="form-input"
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    required
                  >
                    <option value="">-- Ke --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jumlah (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input
                    type="date"
                    className="form-input"
                    value={transferForm.date}
                    onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi / Catatan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Misal: Pindah kas ke e-Wallet"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowTransferModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Memproses...' : 'Kirim Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}