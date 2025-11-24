// 메모장 필터 영역 (찜, grid)

import NotepadTab from "@/Pages/Calenote/Sections/Notepad/NotepadFilterSection/NotepadTab.jsx";
import NotepadGrid from "@/Pages/Calenote/Sections/Notepad/NotepadFilterSection/NotepadGrid.jsx";
import NotepadTitle from "@/Pages/Calenote/Sections/Notepad/NotepadFilterSection/NotepadTitle.jsx";
import NotepadCategory from "@/Pages/Calenote/Sections/Notepad/NotepadFilterSection/NotepadCategory.jsx";
import {useState} from "react";

export default function NotepadFilterSection({ tab, setTab, viewOption, setViewOption, setSearchTitle, categories, setSearchCategory }) {
    const [temporarySearchCategory, setTemporarySearchCategory] = useState(" ");

    return (
        <div className="sticky top-0 py-3 z-[1] bg-gray-100 dark:bg-gray-950 space-y-3">
            <div className="flex justify-between">
                <NotepadTab tab={tab} setTab={setTab} />
                <NotepadGrid viewOption={viewOption} setViewOption={setViewOption} />
            </div>

            <div className="flex justify-start space-x-0 sm:space-x-5 flex-col sm:flex-row">
                <NotepadCategory temporarySearchCategory={temporarySearchCategory} setTemporarySearchCategory={setTemporarySearchCategory} categories={categories} />
                <NotepadTitle setSearchTitle={setSearchTitle} setSearchCategory={setSearchCategory} temporarySearchCategory={temporarySearchCategory} />
            </div>
        </div>
    );
}
