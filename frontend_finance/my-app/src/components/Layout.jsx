import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="app-layout">
            {/* Header / Top Bar Khusus Mobile (Hanya Tombol Hamburger) */}
            <header className="mobile-header">
                <div className="mobile-header-content">
                    <button 
                        className="mobile-menu-btn" 
                        onClick={toggleSidebar}
                        aria-label="Buka Menu"
                    >
                        ☰
                    </button>
                </div>
            </header>

            {/* Sidebar Drawer (Berisi Navigation, Profil, dan Tombol Exit) */}
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}