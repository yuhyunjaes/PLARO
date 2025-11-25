// form 모달 컴포넌트 - 다중 FormInput 지원
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import FormInput from "@/Components/Elements/FormInput.jsx";
import { useCallback } from "react";

export default function FormModal({
    Title,
    SubmitText,
    Inputs = [], // [{label, type, id, name, value}]
    toggle,
    setToggle,
    onChangeArray = () => {}, // (index, newValue) => {}
    Submit
                                  }) {
    const close = useCallback(() => {
        Inputs.forEach((input, idx) => onChangeArray(idx, ""));
        setToggle(false);
    }, [Inputs, onChangeArray, setToggle]);

    return (
        <div
            onClick={close}
            className="absolute inset-0 z-[1] bg-black/30 flex justify-center items-center px-5"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="overflow-hidden divide-y divide-gray-200 dark:divide-gray-700
          max-w-[500px] rounded-4xl bg-gray-100 dark:bg-gray-950
          border border-gray-200 dark:border-gray-700 container"
            >
                <div className="p-5 mb-2 flex justify-between items-center">
                    {Title && <h1 className="normal-text text-xl font-semibold">{Title}</h1>}
                    <button onClick={close}>
                        <FontAwesomeIcon className="normal-text cursor-pointer" icon={faX} />
                    </button>
                </div>

                {Inputs.map((input, idx) => (
                    <div key={idx} className="p-5 mb-2">
                        <FormInput
                            autoFocus={idx === 0}
                            label={input.label}
                            type={input.type}
                            id={input.id}
                            name={input.name}
                            value={input.value}
                            onChange={(e) => onChangeArray(idx, e.target.value)}
                        />
                    </div>
                ))}

                <div className="p-5 flex justify-end items-center space-x-2">
                    <button
                        onClick={close}
                        className="btn text-sm text-white bg-gray-700 hover:bg-gray-800 active:bg-gray-900"
                    >
                        닫기
                    </button>
                    {SubmitText && (
                        <button
                            onClick={() => {
                                if (Inputs.some((input) => !input.value.trim())) return;
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
