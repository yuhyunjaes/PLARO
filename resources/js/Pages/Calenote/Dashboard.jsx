import { Head, router } from '@inertiajs/react';
import NoteInsightSection from "@/Components/Calenote/Dashboard/NoteInsightSection.jsx";
import NotepadCountSection from "@/Components/Calenote/Dashboard/NotepadCountSection.jsx";
export default function Calendar({ auth }) {
    return (
        <>
            <Head title="Dashboard"/>
            <div className="w-full min-h-full p-5 bg-gray-100 dark:bg-gray-950 grid grid-cols-2 lg:grid-cols-4 grid-rows-5 gap-5 overflow-y-auto">                <NotepadCountSection />

                <div className="card border border-gray-300 dark:border-gray-800"></div>

                <div className="card border border-gray-300 dark:border-gray-800 col-span-2 lg:col-span-2 lg:row-span-3">
                </div>

                <NoteInsightSection />


                <div className="card border row-span-2 border-gray-300 dark:border-gray-800 col-span-2 lg:col-span-4"></div>
            </div>

        </>
    );
}
