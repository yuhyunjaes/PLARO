// form 모달 컴포넌트 - 다중 FormInput 지원
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { Dispatch, SetStateAction, useCallback, ChangeEvent } from "react";
import FormInput from "./FormInput";

interface FormInputData {
    label: string;
    type: string;
    id: string;
    name: string;
    value: string;
}

interface FormModalProps {
    Title: string;
    SubmitText: string;
    toggle: boolean;
    setToggle: Dispatch<SetStateAction<boolean>>;
    Submit: () => Promise<false | undefined>;
    // 다중 Input 방식
    Inputs?: FormInputData[];
    onChangeArray?: (index: number, value: string) => void;

    // 단일 Input 방식
    Label?: string;
    Type?: string;
    Name?: string;
    Id?: string;
    Value?: string;
    onChange?: (value: string) => void;
}

export default function FormModal({
                                      Title,
                                      SubmitText,
                                      Inputs,
                                      setToggle,
                                      onChangeArray = () => {},
                                      Submit,
                                      Label,
                                      Type,
                                      Name,
                                      Id,
                                      Value,
                                      onChange
                                  }: FormModalProps) {
    const close = useCallback(() => {
        if (Inputs) {
            Inputs.forEach((input, idx) => onChangeArray(idx, ""));
        }
        if (onChange) {
            onChange("");
        }
        setToggle(false);
    }, [Inputs, onChangeArray, setToggle, onChange]);

    // 단일 Input인지 다중 Input인지 판별
    const isSingleInput = !Inputs && Label;

    return (
        <div
            onClick={close}
            className="fixed inset-0 z-[999] bg-black/30 flex justify-center items-center px-5"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="overflow-hidden divide-y divide-gray-200 dark:divide-gray-700
                    max-w-[500px] rounded bg-gray-100 dark:bg-gray-950
                    border border-gray-200 dark:border-gray-700 container"
            >
                <div className="p-5 mb-2 flex justify-between items-center">
                    {Title && <h1 className="normal-text text-xl font-semibold">{Title}</h1>}
                    <button onClick={close}>
                        <FontAwesomeIcon className="normal-text cursor-pointer" icon={faX} />
                    </button>
                </div>

                {/* 단일 Input 방식 */}
                {isSingleInput && (
                    <div className="p-5 mb-2">
                        <FormInput
                            autoFocus={true}
                            label={Label}
                            type={Type || "text"}
                            id={Id || ""}
                            name={Name || ""}
                            value={Value || ""}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange && onChange(e.target.value)}
                        />
                    </div>
                )}

                {/* 다중 Input 방식 */}
                {Inputs && Inputs.map((input, idx) => (
                    <div key={idx} className="p-5 mb-2">
                        <FormInput
                            autoFocus={idx === 0}
                            label={input.label}
                            type={input.type}
                            id={input.id}
                            name={input.name}
                            value={input.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeArray(idx, e.target.value)}
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
                            onClick={async () => {
                                // 단일 Input 검증
                                if (isSingleInput && (!Value || !Value.trim())) return;

                                // 다중 Input 검증
                                if (Inputs && Inputs.some((input) => !input.value.trim())) return;

                                const data = await Submit();
                                if(data === undefined) {
                                    close();
                                }
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
