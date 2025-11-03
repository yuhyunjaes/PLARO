import {useState, useEffect } from "react";
import axios from "axios";
import { Head, Link } from "@inertiajs/react";
import Loading from '@/Components/Elements/Loading.jsx';

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

    const [loading, setLoading] = useState(false);

    // 비밀번호 일치 확인
    useEffect(() => {
        if (!password && !confirmPassword) {
            setPasswordMatch(false);
        } else {
            setPasswordMatch(password === confirmPassword);
        }
    }, [password, confirmPassword]);


    async function checkId() {
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
    }

    // 이메일 인증코드 전송
    async function sendEmailCode() {
        if (!email) return setEmailMessage("이메일을 입력해주세요.");
        setLoading(true);

        try {
            setEmailAuthCode("");
            const res = await axios.post("/send-email-code", { email });
            const data = res.data;
            setEmailCode(data.success);
            setEmailMessage(data.message);
            if (data.success) {
                setLoading(false);
                setEmailTimer(90);
            }
        } catch (err) {
            console.error(err);
            setEmailMessage("이메일 전송 중 오류가 발생했습니다.");
        }
    }

    // 이메일 타이머
    useEffect(() => {
        if(!isEmailVerified) {
            if (emailCode && emailTimer === 0) {
                setEmailCode(false);
                setEmailMessage("이메일 인증에 실패하였습니다.");
                return;
            }
            const timer = setInterval(() => setEmailTimer((t) => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [emailTimer, isEmailVerified, emailCode]);

    // 이메일 인증 확인
    async function verifyEmailCode() {
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
    }

    // 제출
    function handleSubmit(e) {
        e.preventDefault();
        if(!name) return alert("이름을 작성해주세요.");
        if(!userId) return alert("아이디를 작성해주세요.");
        if (!idConfirm) return alert("아이디 중복확인은 필수압니다.");
        if(!password) return alert("비밀번호를 작성해주세요.");
        if (!passwordMatch) return alert("비밀번호가 일치하지 않습니다.");
        if (!isEmailVerified) return alert("이메일 인증이 필요합니다.");
        e.target.submit();
    }

    return (
        <>
            <Head title="회원가입" />
            <div className="flex justify-center pt-8">
                <form
                    method="POST"
                    action="/register"
                    onSubmit={handleSubmit}
                    className="space-y-5 w-[400px] p-5"
                >

                    {/*일단 CSRF토큰 때문에 안됨 여기부터 시작*/}

                    <div className="text-center space-y-5">
                        <div className="flex justify-center">
                            <Link href="/" className="w-12 block">
                                <img src="/asset/images/Logo/icon.png" alt="" className=""/>
                            </Link>
                        </div>
                        <p className="text-xl text-gray-950 dark:text-white font-semibold">
                            계정을 생성하고 시작하세요
                        </p>
                    </div>

                    <div>
                        <label htmlFor="name" className="form-label">이름</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="user_id" className="form-label">아이디</label>
                        <div className="flex gap-1">
                            <input
                                type="text"
                                id="user_id"
                                name="user_id"
                                value={userId}
                                onChange={(e) => {
                                    setUserId(e.target.value);
                                    setIdMessage("");
                                    setIdConfirm(false);
                                }}
                                className="form-control flex-1"
                            />
                            <button
                                type="button"
                                onClick={checkId}
                                className="form-btn"
                            >
                                중복확인
                            </button>
                        </div>
                        {idMessage && (
                            <p className="form-message">{idMessage}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="form-label">비밀번호</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div>
                        <label htmlFor="password_confirmation" className="form-label">비밀번호 확인</label>
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-control"
                        />
                        {!passwordMatch && (password || confirmPassword) && (
                            <p className="text-sm text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="form-label">이메일</label>
                        <div className="flex gap-1">
                            <input
                                readOnly={(emailCode || isEmailVerified)}
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control flex-1"
                            />
                            <button
                                type="button"
                                onClick={sendEmailCode}
                                className="form-btn"
                                disabled={(emailCode || isEmailVerified)}
                            >
                                {isEmailVerified
                                    ? "인증완료"
                                    : emailTimer > 0
                                        ? `재전송(${emailTimer}s)`
                                        : "인증코드 전송"}
                            </button>
                        </div>
                        {emailMessage && (
                            <p className="form-message">{emailMessage}</p>
                        )}
                    </div>

                    <div
                        className={`${(emailCode && !isEmailVerified) ? 'max-h-[400px]' : 'max-h-0'} overflow-hidden transition-[max-height] duration-300`}
                    >
                        <label htmlFor="email-auth" className="form-label">이메일 인증</label>
                        <div className="flex gap-1">
                            <input
                                name="email-auth"
                                id="email-auth"
                                type="number"
                                value={emailAuthCode}
                                onChange={(e) => setEmailAuthCode(e.target.value)}
                                className="form-control flex-1"
                                disabled={isEmailVerified}
                            />
                            <button
                                type="button"
                                onClick={verifyEmailCode}
                                className="form-btn"
                                disabled={isEmailVerified}
                            >
                                {isEmailVerified ? "인증완료" : "인증하기"}
                            </button>
                        </div>
                    </div>


                    <button
                        type="submit"
                        className="btn w-full main-btn mt-1"
                    >
                        회원가입
                    </button>
                </form>
            </div>
            {loading ? (
                <Loading/>
            ) : ''}
        </>
    );
}
