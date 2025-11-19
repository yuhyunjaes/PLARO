import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {useCallback, useEffect, useRef} from "react";

export default function NotepadShare({ notepadId, shareId, setShareId, setLoading }) {
    const menuRef = useRef(null);

    const handleClickOutside = useCallback( (e) => {
        if (shareId === notepadId && menuRef.current && !menuRef.current.contains(e.target)) {
            setShareId("");
        }
    }, [shareId, notepadId, setShareId]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const sendEmail = async (notepad) => {
        if(!notepad) return;
        setLoading(true);
        try {
            const res = await axios.post(`/api/notepads/${notepad}/share/email`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setShareId("");
        }
    }

    return (
        <div
            onClick={() => {
                setShareId(notepadId)
            }}
            className={`transition-colors duration-300 relative ${
                shareId === notepadId
                    ? "text-blue-700"
                    : "text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700"
            }`}
        >
            <FontAwesomeIcon icon={faShareNodes} />

            {shareId === notepadId && (
                <div
                    ref={menuRef}
                    className="w-[200px] absolute p-2 dark:bg-[#0d1117] border dark:border-gray-800 left-0 top-[100%] shadow-md rounded-2xl"
                >
                    <button onClick={() => {
                        sendEmail(shareId)
                    }} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
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
