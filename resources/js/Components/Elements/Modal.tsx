// 모달 컴포넌트

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useState} from "react";

interface ModalProps {
    Title: string;
    Text?: string;
    Position: string;
    CloseText: string;
    setEditStatus: Dispatch<SetStateAction<string>>;
    setModal: Dispatch<SetStateAction<boolean>>;
    setEditId: Dispatch<SetStateAction<string>>;
    onClickEvent: ()=> Promise<void>;
    custom?: boolean;
}

export default function Modal({ Title, Text, Position, CloseText, setEditStatus, setModal, setEditId, onClickEvent, custom = false } : ModalProps ) {
    const [modalAnimation, setModalAnimation] = useState("in");

    const Close = () => {
        setModalAnimation("out");
        setTimeout(() => {
            setEditStatus("");
            setEditId("");
            setModal(false);
        }, 500);
    };

    const handleConfirm = async () => {
        setModalAnimation("out");
        await onClickEvent();
        setTimeout(() => {
            if(custom) {
                setEditStatus("");
                setEditId("");
            }
            setModal(false);
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-[14000] flex justify-center items-center" onClick={Close}>
            <div
                className={`w-full ${
                    modalAnimation === "in" ? "animate-in-modal" : "animate-out-modal"
                } overflow-hidden divide-y divide-gray-200 dark:divide-gray-700
        max-w-[500px] rounded bg-gray-100 dark:bg-gray-950
        border border-gray-300 dark:border-gray-700 absolute ${
                    Position === "top" ? "top-0 mt-10" : Position === "bottom" ? "bottom-0 mb-10" : "top-1/2 -translate-y-1/2"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 mb-2 flex justify-between items-center">
                    {Title && <h1 className="normal-text text-xl font-semibold">{Title}</h1>}
                    {/*<button type="button" onClick={Close} className="modal-close-btn" aria-label="닫기">*/}
                    {/*    <FontAwesomeIcon className="pointer-events-none text-xs md:text-sm" icon={faX} />*/}
                    {/*</button>*/}
                </div>

                {Text && (
                    <div className="p-5 mb-2">
                        <p className="normal-text font-semibold text-sm">{Text}</p>
                    </div>
                )}

                <div className="p-5 flex justify-end items-center space-x-2">
                    <button className="btn text-sm text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900" onClick={Close}>
                        닫기
                    </button>
                    {CloseText && (
                        <button
                            onClick={handleConfirm}
                            className="btn text-sm text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                        >
                            {CloseText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
