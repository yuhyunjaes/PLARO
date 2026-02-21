// 로그인 페이지

import {Head, Link, router} from '@inertiajs/react';
import {useState} from "react";
import FormInput from "../../Components/Elements/FormInput";
import SocialLoginButtons from "../../Components/Auth/SocialLoginButtons";

interface LoginProps {
    socialError?: string | null;
}

export default function Login({ socialError }:LoginProps) {
    const [login, setLogin] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const userIdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;

    const  handleSubmit = (e :any) => {
        e.preventDefault();
        if(!login) return alert("아이디를 작성해주세요.");
        const trimmedLogin = login.trim();
        const isEmailLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedLogin);

        if (!isEmailLogin) {
            if (!userIdRegex.test(trimmedLogin)) return alert("아이디는 영문/숫자 조합으로 입력해주세요.");
            if (trimmedLogin.length < 4) return alert("아이디는 4자 이상 입력해주세요.");
            if (trimmedLogin.length > 15) return alert("아이디는 15자 이하로 입력해주세요.");
        }

        if(!password) return alert("비밀번호를 작성해주세요.");

        router.post("/login", {
            login : trimmedLogin,
            password : password
        }, {
            onError: (err) => {
                alert(err.message);
                setPassword("");
            }
        })
    }

    return (
        <>
            <Head title="로그인" />
            <div className="flex justify-center pt-8">
                <form
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
                        onChange={(e) => setLogin(e.target.value)}
                    />
                    <FormInput
                        label="비밀번호"
                        type="password"
                        name="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="text-right mt-2">
                        <Link href="/forgot-password" className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                            비밀번호를 잊으셨나요?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        className="btn w-full main-btn my-2"
                    >
                        로그인
                    </button>
                    {socialError && (
                        <p className="text-xs font-semibold text-red-500 text-center mt-2">
                            {socialError}
                        </p>
                    )}
                    <p className="text-center text-xs font-semibold text-gray-500 my-3">또는</p>
                    <SocialLoginButtons />
                    <div className="text-center">
                        <Link href="/register" className="normal-text font-semibold text-xs">회원가입</Link>
                    </div>
                </form>
            </div>
        </>
    );
}
