import { Dispatch, forwardRef, SetStateAction } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";

interface ContentsProps {
    setModal: Dispatch<SetStateAction<boolean>>;
}

const Contents = forwardRef<HTMLDivElement, ContentsProps>(
    ({ setModal }, ref) => {
        return (
            <div
                ref={ref}
                className="absolute z-[2] top-11 right-6 w-[160px] p-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800 rounded"
            >
                <button
                    onClick={() => setModal(true)}
                    className="btn text-xs transition-colors duration-150 w-full flex justify-start items-center px-0 py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1"
                >
                    <FontAwesomeIcon icon={faTrashCan} />
                    <span>삭제</span>
                </button>
            </div>
        );
    }
);

export default Contents;
