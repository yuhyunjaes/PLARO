// 회원가입 페이지

import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { Head, Link, router } from "@inertiajs/react";
import Loading from "../../Components/Elements/Loading";
import FormInput from "../../Components/Elements/FormInput";
import FormInputWithButton from "../../Components/Elements/FormInputWithButton";

interface RegisterProps {
    sessionEmail: string | null;
}

export default function Register({ sessionEmail }:RegisterProps) {
    const nationalityOptions = [
        { code: "KR", label: "대한민국" },
        { code: "JP", label: "일본" },
        { code: "CN", label: "중국" },
        { code: "TW", label: "대만" },
        { code: "HK", label: "홍콩" },
        { code: "SG", label: "싱가포르" },
        { code: "TH", label: "태국" },
        { code: "VN", label: "베트남" },
        { code: "PH", label: "필리핀" },
        { code: "ID", label: "인도네시아" },
        { code: "IN", label: "인도" },
        { code: "AE", label: "아랍에미리트" },
        { code: "SA", label: "사우디아라비아" },
        { code: "TR", label: "튀르키예" },
        { code: "DE", label: "독일" },
        { code: "FR", label: "프랑스" },
        { code: "GB", label: "영국" },
        { code: "IT", label: "이탈리아" },
        { code: "ES", label: "스페인" },
        { code: "NL", label: "네덜란드" },
        { code: "RU", label: "러시아" },
        { code: "AU", label: "호주" },
        { code: "NZ", label: "뉴질랜드" },
        { code: "CA", label: "캐나다" },
        { code: "US", label: "미국" },
        { code: "MX", label: "멕시코" },
        { code: "BR", label: "브라질" },
        { code: "AR", label: "아르헨티나" },
        { code: "CL", label: "칠레" },
        { code: "ZA", label: "남아프리카공화국" },
        { code: "EG", label: "이집트" },
    ];

    const [userId, setUserId] = useState<string>("");
    const [idMessage, setIdMessage] = useState<string>("");
    const [idConfirm, setIdConfirm] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [passwordMatch, setPasswordMatch] = useState<boolean>(true);
    const [email, setEmail] = useState<string>(sessionEmail ?? "");
    const [name, setName] = useState<string>("");
    const [nationality, setNationality] = useState<string>("");
    const [emailAuthCode, setEmailAuthCode] = useState<string>("");
    const [emailCode, setEmailCode] = useState<boolean>(false);
    const [emailMessage, setEmailMessage] = useState<string>("");
    const [emailTimer, setEmailTimer] = useState<number>(0);
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

    const [loadingToggle, setLoading] = useState<boolean>(false);

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
    function handleSubmit(e : any) {
        e.preventDefault();
        if(!name) return alert("이름을 작성해주세요.");
        if(!nationality) return alert("국적을 선택해주세요.");
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
            nationality,
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
                    <div className="w-full">
                        <label htmlFor="nationality" className="form-label">
                            국적
                        </label>
                        <select
                            id="nationality"
                            name="nationality"
                            value={nationality}
                            onChange={(e) => setNationality(e.target.value)}
                            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100"
                        >
                            <option value="">국적을 선택해주세요</option>
                            {nationalityOptions.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
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
                        autoComplete="username"
                    />
                    <FormInput
                        label="비밀번호"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <FormInput
                        label="비밀번호 확인"
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        message={(!passwordMatch && (password || confirmPassword)) ? "비밀번호가 일치하지 않습니다." : undefined}
                        messageType="error"
                        autoComplete="new-password"
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
                        readOnly={!!sessionEmail}
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
                        <Link href="/login" className="normal-text font-semibold text-xs">로그인</Link>
                    </div>
                </form>
            </div>
            <Loading Toggle={loadingToggle}/>
        </>
    );
}
