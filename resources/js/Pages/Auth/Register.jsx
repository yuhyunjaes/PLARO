// 회원가입 페이지

import { useCallback, useState, useEffect, useRef} from "react";
import axios from "axios";
import { Head, Link, router } from "@inertiajs/react";
import Loading from '@/Components/Elements/Loading.jsx';
import FormInput from '@/Components/Elements/FormInput.jsx';
import FormInputWithButton from '@/Components/Elements/FormInputWithButton.jsx';

export default function Register() {
    const [userId, setUserId] = useState("");
    const [idMessage, setIdMessage] = useState("");
    const [idConfirm, setIdConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [emailAuthCode, setEmailAuthCode] = useState("");
    const [emailCode, setEmailCode] = useState(false);
    const [emailMessage, setEmailMessage] = useState("");
    const [emailTimer, setEmailTimer] = useState(0);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const [loadingToggle, setLoading] = useState(false);

    // 비밀번호 일치 확인
    useEffect(() => {
        if (!password && !confirmPassword) {
            setPasswordMatch(false);
        } else {
            setPasswordMatch(password === confirmPassword);
        }
    }, [password, confirmPassword]);

    const checkId = useCallback(async () => {
        if (!userId) return setIdMessage("아이디를 작성해주세요.");

        try {
            const res = await axios.get(`/check-id/${userId}`);
            const data = res.data;
            setIdConfirm(data.success);
            setIdMessage(data.success ? "사용 가능한 아이디입니다." : "이미 존재하는 아이디입니다.");
        } catch (err) {
            console.error(err);
            setIdMessage("아이디 확인 중 오류가 발생했습니다.");
        }
    }, [userId])

    // 이메일 인증코드 전송
    const sendEmailCode = useCallback(async () => {
        if (!email) return setEmailMessage("이메일을 입력해주세요.");
        setLoading(true);

        try {
            setEmailAuthCode("");
            const res = await axios.post("/send-email-code", { email });
            const data = res.data;
            setEmailCode(data.success);
            setEmailMessage(data.message);
            if (data.success) {
                setEmailTimer(90);
            }
        } catch (err) {
            console.error(err);
            setEmailMessage("이메일 전송 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }, [email]);

    // 이메일 타이머
    useEffect(() => {
        if (!isEmailVerified && emailCode) {
            const timer = setInterval(() => {
                setEmailTimer((t) => {
                    if (t <= 1) {
                        clearInterval(timer);
                        setEmailCode(false);
                        setEmailMessage("이메일 인증에 실패하였습니다.");
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isEmailVerified, emailCode]);

    // 이메일 인증 확인
    const verifyEmailCode = useCallback(async () => {
        try {
            const res = await axios.post("/check-email-code", { code: emailAuthCode });
            const data = res.data;
            setEmailMessage(data.message);
            setEmailCode(!data.success);
            setIsEmailVerified(data.success);
        } catch (err) {
            console.error(err);
            setEmailMessage("이메일 인증 중 오류가 발생했습니다.");
        }
    }, [emailAuthCode]);

    // 제출
    function handleSubmit(e) {
        e.preventDefault();
        if(!name) return alert("이름을 작성해주세요.");
        if(!userId) return alert("아이디를 작성해주세요.");
        if (!idConfirm) return alert("아이디 중복확인은 필수압니다.");
        if(!password) return alert("비밀번호를 작성해주세요.");
        if (!passwordMatch) return alert("비밀번호가 일치하지 않습니다.");
        if (!isEmailVerified) return alert("이메일 인증이 필요합니다.");

        router.post('/register', {
            user_id: userId,
            password,
            password_confirmation: confirmPassword,
            name,
            email,
        }, {
            onSuccess: () => {
                alert("회원가입이 완료되었습니다.");
            }
        });
    }

    return (
        <>
            <Head title="회원가입" />
            <div className="flex justify-center pt-8">
                <form
                    method="POST"
                    action="/register"
                    onSubmit={handleSubmit}
                    className="w-[400px] p-5"
                >
                    <div className="text-center space-y-3 pb-5">
                        <div className="flex justify-center">
                            <Link href="/" className="w-12 block">
                                <img src="/asset/images/Logo/icon.png" alt="" className=""/>
                            </Link>
                        </div>
                        <p className="text-xl text-gray-950 dark:text-white font-semibold">
                            새 계정을 만들어 서비스를 이용하세요
                        </p>
                    </div>
                    <FormInput
                        autoFocus={true}
                        label="이름"
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <FormInputWithButton
                        label="아이디"
                        id="user_id"
                        name="user_id"
                        value={userId}
                        onChange={(e) => {
                            setUserId(e.target.value);
                            setIdMessage("");
                            setIdConfirm(false);
                        }}
                        buttonText="중복확인"
                        onButtonClick={checkId}
                        message={idMessage}
                    />
                    <FormInput
                        label="비밀번호"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <FormInput
                        label="비밀번호 확인"
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        message={!passwordMatch && (password || confirmPassword) && "비밀번호가 일치하지 않습니다."}
                        messageType="error"
                    />
                    <FormInputWithButton
                        label="이메일"
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        message={emailMessage && (emailMessage)}
                        onButtonClick={sendEmailCode}
                        disabled={(emailCode || isEmailVerified)}
                        buttonText={isEmailVerified
                            ? "인증완료"
                            : emailTimer > 0
                                ? `재전송(${emailTimer}s)`
                                : "인증코드 전송"}
                    />
                    <FormInputWithButton
                        label="이메일 인증"
                        id="email-auth"
                        name="email-auth"
                        type="number"
                        value={emailAuthCode}
                        onChange={(e) => setEmailAuthCode(e.target.value)}
                        buttonText={isEmailVerified ? "인증완료" : "인증하기"}
                        onButtonClick={verifyEmailCode}
                        disabled={isEmailVerified}
                        className={`${(emailCode && !isEmailVerified) ? 'max-h-[400px]' : 'max-h-0'} overflow-hidden transition-[max-height] duration-300`}
                    />

                    <button
                        type="submit"
                        className="btn w-full main-btn my-2"
                    >
                        회원가입
                    </button>
                    <div className="text-center">
                        <Link href="/login" className="normal-text font-semibold text-sm">로그인</Link>
                    </div>
                </form>
            </div>
            <Loading Toggle={loadingToggle}/>
        </>
    );
}
