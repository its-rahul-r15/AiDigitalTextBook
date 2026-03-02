import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import MobileNav from './MobileNav/MobileNav';
import styles from './Layout.module.css';

const Layout = () => (
    <div className={styles.root}>
        <Sidebar />
        <main className={styles.main}>
            <div className={styles.content}>
                <Outlet />
            </div>
        </main>
        <MobileNav />
    </div>
);

export default Layout;
