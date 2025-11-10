import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faFaceSmile, faFaceMeh, faFaceFrown } from "@fortawesome/free-solid-svg-icons";
import {useState} from "react";
export default function AlertSection() {
    const [mood, setMood] = useState("");

    return (
        <div className="flex justify-between flex-wrap items-center mb-5 space-y-5 lg:space-y-0">
            <p className="space-x-2 font-semibold normal-text">
                <FontAwesomeIcon icon={faCalendar} />
                <span className="text-sm md:text-base">사용자는 오늘 하루 동안 총 3건의 일정을 예정하고 있습니다.</span>
            </p>

            <div className="space-y-2 text-center w-auto">
                <p className="font-semibold text-sm normal-text">오늘의 기분을 선택해주세요. </p>
                <div className="w-1/2 flex justify-between items-center">
                    <button onClick={() => {
                        if(mood === "Happy") {
                            setMood("");
                            return;
                        }
                        setMood("Happy");
                    }} className={`rounded-full transition-[scale] duration-150 hover:scale-110 cursor-pointer ${(mood === "Happy") ? "text-yellow-300 scale-110" : "text-gray-950 dark:text-white hover:text-yellow-300"}`}>
                        <FontAwesomeIcon className="text-4xl" icon={faFaceSmile} />
                    </button>
                    <button onClick={() => {
                        if(mood === "Neutral") {
                            setMood("");
                            return;
                        }
                        setMood("Neutral");
                    }} className={`rounded-full transition-[scale] duration-150 hover:scale-110 cursor-pointer ${(mood === "Neutral") ? "text-yellow-300 scale-110" : "text-gray-950 dark:text-white hover:text-yellow-300"}`}>
                        <FontAwesomeIcon className="text-4xl" icon={faFaceMeh} />
                    </button>
                    <button onClick={() => {
                        if(mood === "Bad") {
                            setMood("");
                            return;
                        }
                        setMood("Bad");
                    }} className={`rounded-full transition-[scale] duration-150 hover:scale-110 cursor-pointer ${(mood === "Bad") ? "text-yellow-300 scale-110" : "text-gray-950 dark:text-white hover:text-yellow-300"}`}>
                        <FontAwesomeIcon className="text-4xl" icon={faFaceFrown} />
                    </button>
                </div>
            </div>
        </div>
    );
}
