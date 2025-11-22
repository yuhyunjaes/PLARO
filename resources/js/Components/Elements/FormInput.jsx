// input:text 컴포넌트
export default function FormInput({
    label,
    id,
    name,
    type = "text",
    value,
    onChange,
    message = "",
    messageType = "default", // 'error' 또는 'default'
    readOnly = false,
    autoFocus = false
}) {
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
            />
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
