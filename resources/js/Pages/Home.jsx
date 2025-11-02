import { Head, Link } from '@inertiajs/react';
import MainSection from '@/Components/Home/MainSection.jsx';
import MessageSection from '@/Components/Home/MessageSection.jsx';
import EducationMinistrySection from '@/Components/Home/EducationMinistrySection.jsx';
import {useState} from "react";

export default function Home({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Home"></Head>
            <div className="w-full overflow-x-hidden">
                <MainSection />
                <MessageSection />
                <EducationMinistrySection/>
            </div>
        </>
    );
}
