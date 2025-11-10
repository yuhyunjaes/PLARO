import { Head, router } from '@inertiajs/react';
import MainTitleSection from "@/Components/Calenote/Dashboard/MainTitleSection.jsx";
import AlertSection from "@/Components/Calenote/Dashboard/AlertSection.jsx";
import ContentsSection from "@/Components/Calenote/Dashboard/ContentsSection.jsx";
export default function Calendar({ auth }) {
    return (
        <>
            <Head title="Dashboard"/>
            <div className="size-full bg-white dark:bg-[#0d1117] flex flex-col py-10 px-5 lg:px-10 overflow-x-hidden overflow-y-auto md:overflow-y-hidden">
                <MainTitleSection auth={auth} />
                <AlertSection />
                <ContentsSection/>
            </div>
        </>
    );
}
