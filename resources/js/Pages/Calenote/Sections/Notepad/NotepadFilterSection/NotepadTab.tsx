import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHeart, faLayerGroup} from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction} from "react";

interface NotepadTabProps {
    tab: "all" | "liked";
    setTab: Dispatch<SetStateAction<"all" | "liked">>;
}

export default function NotepadTab({ tab, setTab }: NotepadTabProps) {
    return(
        <div className="space-x-3 text-xs sm:text-sm">
            <button onClick={() => {
                setTab("all");
            }} className={`font-semibold space-x-1 rounded-2xl cursor-pointer transition-colors duration-150 ${tab === "all" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                <FontAwesomeIcon icon={faLayerGroup}/>
                <span>전체</span>
            </button>
            <button onClick={() => {
                setTab("liked");
            }} className={`font-semibold space-x-1 rounded-2xl cursor-pointer transition-colors duration-150 ${tab === "liked" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                <FontAwesomeIcon icon={faHeart} />
                <span>찜</span>
            </button>
        </div>
    );
}
