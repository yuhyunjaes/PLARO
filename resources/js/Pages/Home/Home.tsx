// 메인 페이지

import { Head } from '@inertiajs/react';
import MainSection from "./Sections/MainSection";
import Footer from "../../Components/Footer/Footer";
import ContentsSection from "./Sections/ContentsSection";
import IntroduceSection from "./Sections/IntroduceSection";
import { AuthUser } from "../../Types/HomeTypes"
import Header from "../../Components/Header/Header";

interface HomeProps {
    auth: {
        user: AuthUser | null;
    };
    laravelVersion: any,
    phpVersion: any
}

export default function Home({ auth } : HomeProps) {
    return (
        <>
            <Head title="Home"></Head>

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
