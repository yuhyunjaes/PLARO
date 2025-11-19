import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faHeart, faLayerGroup, faGrip, faBarsStaggered } from "@fortawesome/free-solid-svg-icons";

export default function NotepadTabSection({ tab, setTab, viewOption, setViewOption }) {
    return (
        <div className="flex justify-between">
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
