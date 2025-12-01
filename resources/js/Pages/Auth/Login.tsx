// 로그인 페이지

import {Head, Link, router} from '@inertiajs/react';
import {useState} from "react";
import FormInput from "../../Components/Elements/FormInput";

export default function Login() {
    const [userId, setUserId] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const  handleSubmit = (e :any) => {
        e.preventDefault();
        if(!userId) return alert("아이디를 작성해주세요.");
        if(!password) return alert("비밀번호를 작성해주세요.");

        router.post("/login", {
            user_id : userId,
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
                    method="POST"
                    action="/Register"
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
                        label="아이디"
                        name="user_id"
                        id="user_id"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                    />
                    <FormInput
                        label="비밀번호"
                        type="password"
                        name="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="btn w-full main-btn my-2"
                    >
                        로그인
                    </button>
                    <div className="text-center">
                        <Link href="/register" className="normal-text font-semibold text-sm">회원가입</Link>
                    </div>
                </form>
            </div>
        </>
    );
}
