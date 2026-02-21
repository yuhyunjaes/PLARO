// input:text 컴포넌트
import { ChangeEvent } from "react";

interface FormInputProps {
    label: string;
    id: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    message?: string;
    messageType?: "error" | "default";
    readOnly?: boolean;
    autoFocus?: boolean;
    autoComplete?: string;
    maxLength?: number;
}

export default function FormInput({
label,
id,
name,
type = "text",
value,
onChange,
message = "",
messageType = "default",
readOnly = false,
autoFocus = false,
autoComplete,
maxLength
}: FormInputProps) {
    return (
        <div>
            <label htmlFor={id} className="form-label">{label}</label>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className="form-control"
                autoFocus={autoFocus}
                autoComplete={autoComplete || undefined}
                maxLength={maxLength}
            />
            {message && (
                <p
                    className={`mt-1 text-xs ${
                        messageType === "error" ? "text-red-500" : "form-message"
                    }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
