// 메인 페이지

import { Head } from '@inertiajs/react';
import MainSection from '@/Pages/Home/Sections/MainSection.jsx';
import IntroduceSection from '@/Pages/Home/Sections/IntroduceSection.jsx';
import ContentsSection from '@/Pages/Home/Sections/ContentsSection.jsx';
import Header from '@/Components/Header/Header.jsx';
import Footer from '@/Components/Footer/Footer.jsx';
export default function Home({ auth }) {
    return (
        <>
            <Head title="Home"></Head>
            {/*헤더 영역*/}
            <Header auth={auth} className="animate-opacityLoad"/>

            <div className="w-full overflow-x-hidden">
                {/*메인 섹션 영역*/}
                <MainSection />

                {/*소개 영역*/}
                <IntroduceSection />

                {/*콘텐츠 소개 영역*/}
                <ContentsSection/>
            </div>

            {/*푸터 영역*/}
            <Footer />
        </>
    );
}
