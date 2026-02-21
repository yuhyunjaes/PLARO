// input:text + button 컴포넌트
import { ChangeEvent } from "react";

interface FormInputWithButtonProps {
    className?: string;
    label: string;
    id: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    buttonText: string;
    onButtonClick: () => void;
    message?: string;
    messageType?: "error" | "default";
    disabled?: boolean;
    autoComplete?: string;
    readOnly?: boolean;
    maxLength?: number;
}

export default function FormInputWithButton({
    className = "",
    label,
    id,
    name,
    type = "text",
    value,
    onChange,
    buttonText,
    onButtonClick,
    message = "",
    messageType = "default",
    disabled = false,
    readOnly = false,
    autoComplete,
    maxLength
}: FormInputWithButtonProps) {
    return (
        <div className={className}>
            <label htmlFor={id} className="form-label">{label}</label>
            <div className="flex gap-1">
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    className="form-control flex-1"
                    disabled={disabled}
                    readOnly={readOnly}
                    autoComplete={autoComplete || undefined}
                    maxLength={maxLength}
                />
                <button
                    type="button"
                    onClick={onButtonClick}
                    className="form-btn"
                    disabled={disabled}
                >
                    {buttonText}
                </button>
            </div>
            {message && (
                <p
                    className={`mt-1 text-sm ${
                        messageType === "error" ? "text-red-500" : "form-message"
                    }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
