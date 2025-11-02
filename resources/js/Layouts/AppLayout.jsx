import Header from '@/Components/Header/Header.jsx';
import Footer from '@/Components/Footer/Footer.jsx';

export default function Layout({ children }) {
    return (
        <div className="bg-white dark:bg-black">
            <Header />
            <main>
                {children}
            </main>
            <Footer />
        </div>
    );
}
