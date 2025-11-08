import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faClipboard } from "@fortawesome/free-solid-svg-icons";

export default function MessageActions({ msg, handleNotepad }) {
    return (
        <div className="absolute h-[50px] bottom-[-50px] left-0 w-full flex justify-start items-center space-x-2">
            <button
                className="btn"
                title="복사"
                onClick={() => {
                    navigator.clipboard.writeText(msg.text);
                    alert("복사가 완료되었습니다.");
                }}
            >
                <FontAwesomeIcon className="normal-text" icon={faCopy}/>
            </button>
            <button
                className="btn"
                title="메모장 저장"
                onClick={() => handleNotepad(msg)}
            >
                <FontAwesomeIcon className="normal-text" icon={faClipboard}/>
            </button>
        </div>
    );
}
