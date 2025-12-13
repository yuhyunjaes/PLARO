// 대시보드 영역

import { Head } from '@inertiajs/react';
import NoteInsightSection from "./Sections/Dashboard/NoteInsightSection";
import NotepadCountSection from "./Sections/Dashboard/NotepadCountSection";
export default function Calendar() {
    return (
        <>
            <Head title="Dashboard"/>
            <div className="w-full min-h-full p-5 bg-gray-100 dark:bg-gray-950 grid grid-cols-2 lg:grid-cols-4 grid-rows-5 gap-5 overflow-y-auto">
                {/*메모장 카운트*/}
                <NotepadCountSection />

                <div className="card border border-gray-300 dark:border-gray-800"></div>

                <div className="card border border-gray-300 dark:border-gray-800 col-span-2 lg:col-span-2 lg:row-span-3">
                </div>

                {/*메모장 카테고리 수치*/}
                <NoteInsightSection />


                <div className="card border row-span-2 border-gray-300 dark:border-gray-800 col-span-2 lg:col-span-4"></div>
            </div>

        </>
    );
}
