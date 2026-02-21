import { Head, Link } from "@inertiajs/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import FormInput from "../../Components/Elements/FormInput";
import FormInputWithButton from "../../Components/Elements/FormInputWithButton";
import Loading from "../../Components/Elements/Loading";

export default function ForgotPassword() {
    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [passwordConfirm, setPasswordConfirm] = useState<string>("");
    const [passwordMatch, setPasswordMatch] = useState<boolean>(true);
    const [emailCodeSent, setEmailCodeSent] = useState<boolean>(false);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);
    const [emailMessage, setEmailMessage] = useState<string>("");
    const [timer, setTimer] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!password && !passwordConfirm) {
            setPasswordMatch(true);
            return;
        }

        setPasswordMatch(password === passwordConfirm);
    }, [password, passwordConfirm]);

    useEffect(() => {
        if (!emailCodeSent || emailVerified || timer <= 0) {
            return;
        }

        const intervalId = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    setEmailCodeSent(false);
                    setEmailMessage("인증시간이 만료되었습니다. 다시 요청해주세요.");
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [emailCodeSent, emailVerified, timer]);

    const sendCode = useCallback(async () => {
        if (!email) {
            setEmailMessage("이메일을 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("/password/send-reset-code", { email });
            const data = res.data;
            setEmailMessage(data.message || "");
            setEmailCodeSent(!!data.success);
            setEmailVerified(false);
            setCode("");
            setTimer(Number(data.ttl_seconds || 180));
        } catch (err: any) {
            const msg = err?.response?.data?.message || "인증번호 전송 중 오류가 발생했습니다.";
            setEmailMessage(msg);
        } finally {
            setLoading(false);
        }
    }, [email]);

    const verifyCode = useCallback(async () => {
        if (!code) {
            setEmailMessage("인증번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("/password/verify-reset-code", { code });
            const data = res.data;
            setEmailMessage(data.message || "");
            setEmailVerified(!!data.success);
            if (data.success) {
                setEmailCodeSent(false);
                setTimer(0);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "인증번호 확인 중 오류가 발생했습니다.";
            setEmailMessage(msg);
            setEmailVerified(false);
        } finally {
            setLoading(false);
        }
    }, [code]);

    const submitReset = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email) return alert("이메일을 입력해주세요.");
        if (!emailVerified) return alert("이메일 인증이 필요합니다.");
        if (!password) return alert("새 비밀번호를 입력해주세요.");
        if (!passwordMatch) return alert("비밀번호가 일치하지 않습니다.");

        setLoading(true);
        try {
            const res = await axios.post("/password/reset", {
                email,
                password,
                password_confirmation: passwordConfirm,
            });
            alert(res.data?.message || "비밀번호가 변경되었습니다.");
            window.location.href = "/login";
        } catch (err: any) {
            const firstError = err?.response?.data?.errors
                ? Object.values(err.response.data.errors)[0]
                : null;
            const msg = (Array.isArray(firstError) ? firstError[0] : firstError) || err?.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.";
            alert(String(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="비밀번호 찾기" />
            <div className="flex justify-center pt-8 px-4">
                <form onSubmit={submitReset} className="w-full max-w-[400px] p-5">
                    <div className="text-center space-y-3 pb-5">
                        <div className="flex justify-center">
                            <Link href="/" className="w-12 block">
                                <img src="/asset/images/Logo/icon.png" alt="" />
                            </Link>
                        </div>
                        <p className="text-xl text-gray-950 dark:text-white font-semibold">
                            비밀번호 찾기
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            이메일 인증 후 새 비밀번호를 설정하세요.
                        </p>
                    </div>

                    <FormInputWithButton
                        label="이메일"
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        buttonText={
                            emailVerified
                                ? "인증완료"
                                : timer > 0
                                    ? `재전송(${timer}s)`
                                    : "인증코드 전송"
                        }
                        onButtonClick={sendCode}
                        disabled={emailVerified}
                        message={emailMessage}
                    />

                    <FormInputWithButton
                        className={`${emailCodeSent && !emailVerified ? "max-h-[400px]" : "max-h-0"} overflow-hidden transition-[max-height] duration-300`}
                        label="인증코드"
                        id="email-code"
                        name="email-code"
                        type="number"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        buttonText={emailVerified ? "인증완료" : "인증하기"}
                        onButtonClick={verifyCode}
                        disabled={emailVerified}
                    />

                    <FormInput
                        label="새 비밀번호"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <FormInput
                        label="새 비밀번호 확인"
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        message={!passwordMatch ? "비밀번호가 일치하지 않습니다." : undefined}
                        messageType="error"
                    />

                    <button type="submit" className="btn w-full main-btn my-2">
                        비밀번호 변경
                    </button>

                    <div className="text-center">
                        <Link href="/login" className="normal-text font-semibold text-xs">
                            로그인으로 돌아가기
                        </Link>
                    </div>
                </form>
            </div>
            <Loading Toggle={loading} />
        </>
    );
}
