// 메모장 필터 영역 (찜, grid)

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faHeart, faLayerGroup, faGrip, faBarsStaggered } from "@fortawesome/free-solid-svg-icons";

export default function NotepadFilterSection({ tab, setTab, viewOption, setViewOption }) {
    return (
        <div className="flex justify-between sticky top-0 py-3 z-[1] bg-gray-100 dark:bg-gray-950">
            <div className="space-x-3 text-sm sm:text-base">
                <button onClick={() => {
                    setTab("all");
                }} className={`font-semibold space-x-1 rounded-2xl cursor-pointer transition-colors duration-300 ${tab === "all" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                    <FontAwesomeIcon icon={faLayerGroup}/>
                    <span>전체</span>
                </button>
                <button onClick={() => {
                    setTab("liked");
                }} className={`font-semibold space-x-1 rounded-2xl cursor-pointer transition-colors duration-300 ${tab === "liked" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                    <FontAwesomeIcon icon={faHeart} />
                    <span>찜</span>
                </button>
            </div>


            <div className="space-x-3 text-sm sm:text-base">
                <button onClick={() => {
                    setViewOption("list");
                }} className={`font-semibold cursor-pointer transition-colors duration-300 ${viewOption === "list" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                    <FontAwesomeIcon icon={faBarsStaggered} />
                </button>
                <button onClick={() => {
                    setViewOption("grid");
                }} className={`font-semibold cursor-pointer transition-colors duration-300 ${viewOption === "grid" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                    <FontAwesomeIcon icon={faGrip} />
                </button>
            </div>
        </div>
    );
}
