// form 모달 컴포넌트

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import FormInput from "@/Components/Elements/FormInput.jsx";
import {useCallback} from "react";
export default function FormModal({Title, SubmitText, Label, Type, Id, Name, Value, onChange, toggle, setToggle, Submit }) {
    const close = useCallback(() => {
        if(toggle) return setToggle(false);
        else if(!toggle) return setToggle(true);
    }, [toggle]);

    return (
        <div onClick={close} className="absolute inset-0 z-[1] bg-black/30 flex justify-center items-center px-5">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                }}
                className="overflow-hidden divide-y divide-gray-200 dark:divide-gray-700
        max-w-[500px] rounded-4xl bg-gray-100 dark:bg-gray-950
        border border-gray-200 dark:border-gray-700 container">
                <div className="p-5 mb-2 flex justify-between items-center">
                    {Title && <h1 className="normal-text text-xl font-semibold">{Title}</h1>}
                    <button onClick={close}>
                        <FontAwesomeIcon className="normal-text cursor-pointer" icon={faX} />
                    </button>
                </div>
                {Label && (
                    <div className="p-5 mb-2">
                        <FormInput autoFocus={true} label={Label} type={Type} id={Id} name={Name} value={Value} onChange={(e)=>onChange(e.target.value)}/>
                    </div>
                )}
                <div className="p-5 flex justify-end items-center space-x-2">
                    <button onClick={close} className="btn text-sm text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900">
                        닫기
                    </button>
                    {SubmitText && (
                        <button
                            onClick={() => {
                                if(!Value.trim()) return;
                                Submit();
                                close();
                            }}
                            className="btn text-sm text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                        >
                            {SubmitText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
