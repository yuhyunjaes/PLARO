import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import FormInput from '../../Components/Elements/FormInput';
import Loading from '../../Components/Elements/Loading';

interface AuthFeedback {
    type?: 'locked';
    message?: string;
    login?: string;
    retry_after?: number;
    account_locked?: boolean;
    ip_account_locked?: boolean;
    unlock_available?: boolean;
    email?: string | null;
    is_social_account?: boolean;
}

interface LoginUnlockProps {
    authFeedback?: AuthFeedback | null;
    prefillLogin?: string | null;
    prefillEmail?: string | null;
}

export default function LoginUnlock({ authFeedback, prefillLogin, prefillEmail }: LoginUnlockProps) {
    const [login] = useState<string>((prefillLogin || authFeedback?.login || '').trim());
    const [email] = useState<string>((prefillEmail || authFeedback?.email || '').trim());
    const [code, setCode] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [lockTimer, setLockTimer] = useState<number>(authFeedback?.retry_after || 0);
    const [resendTimer, setResendTimer] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const lockRemainLabel = useMemo(() => {
        if (lockTimer <= 0) {
            return '';
        }

        const minute = Math.floor(lockTimer / 60);
        const second = lockTimer % 60;
        return `${minute}분 ${String(second).padStart(2, '0')}초`;
    }, [lockTimer]);

    useEffect(() => {
        if (lockTimer <= 0) {
            return;
        }

        const id = setInterval(() => {
            setLockTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(id);
    }, [lockTimer]);

    useEffect(() => {
        if (resendTimer <= 0) {
            return;
        }

        const id = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(id);
    }, [resendTimer]);

    const sendCode = async () => {
        const trimmedLogin = (email || login).trim();
        if (!trimmedLogin) {
            setMessage('아이디 또는 이메일을 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/login/unlock/send-code', {
                login: trimmedLogin,
            });
            setMessage(res.data?.message || '인증번호를 전송했습니다.');
            setResendTimer(Number(res.data?.ttl_seconds || 0));
        } catch (err: any) {
            const ttl = Number(err?.response?.data?.ttl_seconds || 0);
            if (ttl > 0) {
                setResendTimer(ttl);
            }
            setMessage(err?.response?.data?.message || '인증번호 전송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        const trimmedLogin = (email || login).trim();
        if (!trimmedLogin) {
            setMessage('아이디 또는 이메일을 입력해주세요.');
            return;
        }
        if (!code) {
            setMessage('인증번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/login/unlock/verify-code', {
                login: trimmedLogin,
                code,
                action: 'retry',
            });

            if (res.data?.redirect) {
                window.location.href = res.data.redirect;
                return;
            }

            setMessage(res.data?.message || '잠금이 해제되었습니다.');
        } catch (err: any) {
            setMessage(err?.response?.data?.message || '인증 실패. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="계정 잠금 해제" />
            <div className="flex justify-center pt-8 px-4">
                <div className="w-full max-w-[400px] p-5">
                    <div className="text-center space-y-3 pb-5">
                        <div className="flex justify-center">
                            <Link href="/" className="w-12 block">
                                <img src="/asset/images/Logo/icon.png" alt="" />
                            </Link>
                        </div>
                        <p className="text-xl text-gray-950 dark:text-white font-semibold">
                            계정 잠금 해제
                        </p>
                    </div>

                    {authFeedback?.message && (
                        <p className="text-xs font-semibold text-red-500 text-center mb-2">
                            {authFeedback.message}
                        </p>
                    )}
                    {lockRemainLabel && (
                        <p className="text-xs text-gray-500 dark:text-gray-300 text-center mb-3">
                            자동 해제까지 남은 시간: {lockRemainLabel}
                        </p>
                    )}

                    <FormInput
                        label="이메일"
                        id="email"
                        name="email"
                        value={email}
                        onChange={() => {}}
                        readOnly={true}
                        autoComplete="username"
                    />

                    {authFeedback?.unlock_available ? (
                        <button type="button" className="form-btn w-full mt-2" onClick={sendCode} disabled={loading || resendTimer > 0}>
                            {resendTimer > 0 ? `인증코드 재전송 (${resendTimer}s)` : '이메일 인증코드 받기'}
                        </button>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-300 text-center mt-2">
                            이 잠금은 자동 해제까지 기다려 주세요.
                        </p>
                    )}

                    {authFeedback?.unlock_available && (
                        <>
                            <FormInput
                                label="인증코드"
                                id="unlock-code"
                                name="unlock-code"
                                type="number"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                autoComplete="one-time-code"
                            />

                            <div className="mt-2">
                                <button type="button" className="btn main-btn w-full" onClick={verifyCode} disabled={loading}>
                                    {authFeedback?.is_social_account
                                        ? '계정 잠금 해제 후 다시 로그인'
                                        : '계정 잠금 해제 후 비밀번호 변경'}
                                </button>
                            </div>
                        </>
                    )}

                    {message && (
                        <p className="text-xs font-semibold text-center mt-2 text-red-500">
                            {message}
                        </p>
                    )}

                    <div className="text-center mt-4">
                        <Link href="/login" className="normal-text font-semibold text-xs">로그인으로 돌아가기</Link>
                    </div>
                </div>
            </div>
            <Loading Toggle={loading} />
        </>
    );
}
