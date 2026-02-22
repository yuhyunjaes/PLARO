// 메모장 필터 영역 (찜, grid)

import NotepadTab from "./NotepadFilterSection/NotepadTab";
import {Dispatch, SetStateAction, useState} from "react";
import NotepadGrid from "./NotepadFilterSection/NotepadGrid";
import NotepadTitle from "./NotepadFilterSection/NotepadTitle";
import NotepadCategory from "./NotepadFilterSection/NotepadCategory";
import {Category} from "../../../../Types/AppTypes";

interface NotepadFilterSectionProps {
    tab: "all" | "liked";
    setTab: Dispatch<SetStateAction<"all" | "liked">>;
    viewOption: "grid" | "list";
    setViewOption: Dispatch<SetStateAction<"grid" | "list">>;
    setSearchTitle: Dispatch<SetStateAction<string>>;
    categories: string[];
    setSearchCategory: Dispatch<SetStateAction<string>>;
}

export default function NotepadFilterSection({ tab, setTab, viewOption, setViewOption, setSearchTitle, categories, setSearchCategory } : NotepadFilterSectionProps) {
    const [temporarySearchCategory, setTemporarySearchCategory] = useState<string>(" ");

    return (
        <div className="sticky top-0 py-3 z-[1] bg-white dark:bg-gray-950 space-y-3">
            <div className="flex space-x-0 sm:space-x-5 flex-col sm:flex-row">
                <NotepadCategory temporarySearchCategory={temporarySearchCategory} setTemporarySearchCategory={setTemporarySearchCategory} categories={categories} />
                <NotepadTitle setSearchTitle={setSearchTitle} setSearchCategory={setSearchCategory} temporarySearchCategory={temporarySearchCategory} />
            </div>
            <div className="flex justify-between">
                <NotepadTab tab={tab} setTab={setTab} />
                <NotepadGrid viewOption={viewOption} setViewOption={setViewOption} />
            </div>
        </div>
    );
}
