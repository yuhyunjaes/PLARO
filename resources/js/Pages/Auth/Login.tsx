// 로그인 페이지

import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import FormInput from '../../Components/Elements/FormInput';
import SocialLoginButtons from '../../Components/Auth/SocialLoginButtons';
import Loading from '../../Components/Elements/Loading';

interface AuthFeedback {
    type?: 'invalid_credentials' | 'locked';
    message?: string;
    login?: string;
    max_attempts?: number;
    account_remaining?: number;
    ip_account_remaining?: number;
}

interface LoginProps {
    socialError?: string | null;
    logoutReason?: string | null;
    authFeedback?: AuthFeedback | null;
}

export default function Login({ socialError, logoutReason, authFeedback }: LoginProps) {
    const [login, setLogin] = useState<string>((authFeedback?.login || '').trim());
    const [password, setPassword] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const userIdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    const page = usePage<{ errors?: Record<string, string> }>();
    const errors = page.props.errors || {};

    useEffect(() => {
        if (!authFeedback?.login) {
            return;
        }

        setLogin(authFeedback.login);
    }, [authFeedback?.login]);

    const attemptsMessage = useMemo(() => {
        if (!authFeedback) {
            return null;
        }

        const max = authFeedback.max_attempts ?? 5;
        const accountRemaining = authFeedback.account_remaining;
        const ipAccountRemaining = authFeedback.ip_account_remaining;

        if (typeof accountRemaining !== 'number' || typeof ipAccountRemaining !== 'number') {
            return null;
        }

        return `계정 기준 잔여 시도: ${accountRemaining}/${max} · 현재 IP+계정 잔여 시도: ${ipAccountRemaining}/${max}`;
    }, [authFeedback]);

    const handleLoginChange = (value: string) => {
        const sanitized = value.replace(/[^A-Za-z0-9@._-]/g, '');
        setLogin(sanitized);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedLogin = login.trim();
        if (!trimmedLogin) return alert('아이디를 작성해주세요.');

        const isEmailLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedLogin);
        if (!isEmailLogin) {
            if (!userIdRegex.test(trimmedLogin)) return alert('아이디는 영문/숫자 조합으로 입력해주세요.');
            if (trimmedLogin.length < 4) return alert('아이디는 4자 이상 입력해주세요.');
            if (trimmedLogin.length > 15) return alert('아이디는 15자 이하로 입력해주세요.');
        }

        if (!password) return alert('비밀번호를 작성해주세요.');

        setSubmitting(true);
        router.post('/login', {
            login: trimmedLogin,
            password,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setSubmitting(false);
                setPassword('');
            },
        });
    };

    return (
        <>
            <Head title="로그인" />
            <div className="flex justify-center pt-8 px-4">
                <form onSubmit={handleSubmit} className="w-full max-w-[400px] p-5">
                    <div className="text-center space-y-3 pb-5">
                        <div className="flex justify-center">
                            <Link href="/" className="w-12 block">
                                <img src="/asset/images/Logo/icon.png" alt="" className="" />
                            </Link>
                        </div>
                        <p className="text-xl text-gray-950 dark:text-white font-semibold">
                            로그인하여 서비스를 이용하세요
                        </p>
                    </div>

                    <FormInput
                        autoFocus={true}
                        label="아이디 또는 이메일"
                        name="login"
                        id="login"
                        autoComplete="username"
                        value={login}
                        onChange={(e) => handleLoginChange(e.target.value)}
                        message={errors.login}
                        messageType="error"
                    />
                    <FormInput
                        label="비밀번호"
                        type="password"
                        name="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        message={errors.password}
                        messageType="error"
                    />
                    <div className="text-right mt-2">
                        <Link href="/forgot-password" className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                            비밀번호를 잊으셨나요?
                        </Link>
                    </div>
                    <button type="submit" disabled={submitting} className="btn w-full main-btn my-2 disabled:opacity-70">
                        로그인
                    </button>

                    {socialError && (
                        <p className="text-xs font-semibold text-red-500 text-center mt-2">
                            {socialError}
                        </p>
                    )}
                    {logoutReason && (
                        <p className="text-xs font-semibold text-amber-600 text-center mt-2">
                            {logoutReason}
                        </p>
                    )}
                    {authFeedback?.message && (
                        <p className="text-xs font-semibold text-red-500 text-center mt-2">
                            {authFeedback.message}
                        </p>
                    )}
                    {attemptsMessage && (
                        <p className="text-xs font-semibold text-red-500 text-center mt-1">
                            {attemptsMessage}
                        </p>
                    )}
                    {authFeedback && (
                        <p className="text-xs text-gray-500 dark:text-gray-300 text-center mt-1">
                            비밀번호를 5회 연속 틀리면 계정 보호를 위해 15분 잠금됩니다.
                        </p>
                    )}

                    <p className="text-center text-xs font-semibold text-gray-500 my-3">또는</p>
                    <SocialLoginButtons />
                    <div className="text-center">
                        <Link href="/register" className="normal-text font-semibold text-xs">회원가입</Link>
                    </div>
                </form>
            </div>
            <Loading Toggle={submitting} />
        </>
    );
}
