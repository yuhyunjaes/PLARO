import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBarsStaggered, faGrip} from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction} from "react";

interface NotepadGridProps {
    viewOption : "grid" | "list";
    setViewOption: Dispatch<SetStateAction<"grid" | "list">>;
}

export default function NotepadGrid({ viewOption, setViewOption } : NotepadGridProps) {
    return(
        <div className="space-x-3 text-sm sm:text-base">
            <button onClick={() => {
                setViewOption("list");
            }} className={`font-semibold cursor-pointer transition-colors duration-150 ${viewOption === "list" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                <FontAwesomeIcon icon={faBarsStaggered} />
            </button>
            <button onClick={() => {
                setViewOption("grid");
            }} className={`font-semibold cursor-pointer transition-colors duration-150 ${viewOption === "grid" ? "normal-text" : "text-gray-500 hover:text-gray-950 dark:hover:text-white"}`}>
                <FontAwesomeIcon icon={faGrip} />
            </button>
        </div>
    );
}
