
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef} from "react";
import axios from "axios";
import { useContext } from "react";
import {GlobalUIContext} from "../../../../../Providers/GlobalUIContext";
import {AlertsData} from "../../../../../Components/Elements/ElementsData";
import {DateUtils} from "../../../../../Utils/dateUtils";

interface NotepadShareProps {
    notepadId: string;
    shareId: string;
    setShareId: Dispatch<SetStateAction<string>>;
    isLastInRow: boolean;
}

export default function NotepadShare({ notepadId, shareId, setShareId, isLastInRow } : NotepadShareProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
    } = ui;

    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback( (e: MouseEvent) => {
        if (shareId === notepadId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setShareId("");
        }
    }, [shareId, notepadId]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const sendEmail = async (notepad: string) => {
        if(!notepad) return;
        setLoading(true);
        try {
            const res = await axios.post(`/api/notepads/${notepad}/share/email`);
            const alertData:AlertsData = {
                id: DateUtils.now(),
                message: res.data.message,
                type: res.data.type
            }
            setAlerts(pre => [...pre, alertData]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setShareId("");
        }
    }

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setShareId(notepadId)
            }}
            className={`transition-colors duration-150 relative ${
                shareId === notepadId
                    ? "text-blue-700"
                    : "text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700"
            }`}
        >
            <FontAwesomeIcon icon={faShareNodes} />

            {shareId === notepadId && (
                <div
                    ref={menuRef}
                    className={`
                        w-[160px] absolute p-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800 top-[100%] rounded
                        ${isLastInRow ? "right-0" : "left-0"}
                    `}
                >
                    <button onClick={() => {
                        sendEmail(shareId)
                    }} className="btn text-xs transition-colors duration-150 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                        <FontAwesomeIcon icon={faEnvelope}/>
                        <span>
                            메일 공유
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
