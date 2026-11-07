import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import Auth

const navItems = [
    { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { to: '/accounts', icon: '◈', label: 'Wallet' },
    { to: '/transactions', icon: '⇄', label: 'Transaction' },
    { to: '/categories', icon: '◑', label: 'Total Networth' },
    { to: '/budget', icon: '☑', label: 'Budget Planner' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth(); // Ambil user & logout
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        if (onClose) onClose();
    };

    return (
        <>
            {/* Overlay saat sidebar terbuka */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                <div 
                    className="sidebar-brand" 
                    onClick={() => {
                        navigate('/dashboard');
                        if (onClose) onClose();
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="brand-icon">R</div>
                    <div>
                        <div className="brand-name">RadityaFunds</div>
                        <div className="brand-sub">Personal Manager</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ to, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon">{icon}</span>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* FOOTER SIDEBAR: Profile User, Email & Logout */}
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
                        <div className="user-details">
                            <div className="user-name">{user?.name ?? 'User'}</div>
                            <div className="user-email">{user?.email ?? ''}</div>
                        </div>
                    </div>
                    <button className="logout-btn-icon" onClick={handleLogout} title="Keluar">
                        ⏻
                    </button>
                </div>
            </aside>
        </>
    );
}