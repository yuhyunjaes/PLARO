import {Head, Link} from "@inertiajs/react";
import {router} from "@inertiajs/react";
import axios from "axios";
import {useContext} from "react";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";
import Header from "../../Components/Header/Header";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    // 필요한 다른 사용자 속성 추가
}

interface StatusProps {
    auth: {
        user: AuthUser | null;
    };
    mode: "auth" | "guest";
    event: {
        id: number;
        uuid: string;
        title: string;
    };
    inviter: {
      name: string;
      email: string;
    };

    invitation: {
        token: string;
        email: string;
    }
}
export default function Accept({ auth, mode, event, inviter, invitation }:StatusProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("GlobalProvider context is required");
    }

    const {
        setLoading,
    } = ui;

    return (
        <>
            <Head title="Accept" />
            <div className="flex justify-center pt-8">
                <div className="text-center space-y-3 pb-5">
                    <div className="flex justify-center">
                        <Link href="/" className="w-12 block">
                            <img src="/asset/images/Logo/icon.png" alt="" className=""/>
                        </Link>
                    </div>
                    <p className="text-2xl text-gray-950 dark:text-white font-semibold">
                        새로운 일정에 초대되었어요
                    </p>

                    <p className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                        <strong>{inviter.name ? inviter.name : "회원"}</strong>님이
                        {event.title ? (<strong> {event.title}</strong>) : ""} 이벤트에 초대했습니다.
                    </p>

                    <div className="w-full flex justify-center items-center space-x-2 mt-8">
                        <button onClick={async () => {
                            if(mode === "auth") {
                                setLoading(true);
                                try {
                                    const res = await axios.post(`/invitations/${invitation.token}/accept`);
                                    if(res.data.success) {
                                        router.visit(`/calendar/${res.data.uuid}`, {
                                            method: "get",
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    } else if (res.data.redirect) {
                                        router.visit(res.data.redirect, {
                                            method: "get",
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }
                                } catch (err) {
                                    if (axios.isAxiosError(err) && err.response?.data?.redirect) {
                                        router.visit(err.response.data.redirect, {
                                            method: "get",
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    } else {
                                        console.error(err);
                                    }
                                } finally {
                                    setLoading(false);
                                }
                            } else if (mode === "guest") {
                                try {
                                    const res = await axios.post(`/invitations/${invitation.token}/accept/session`);

                                    if(!res.data.success) {
                                        router.visit(`/invitations/${invitation.token}`, {
                                            method: "get",
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                        return;
                                    }

                                    router.visit("/login", {
                                        method: "get",
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                } catch (err) {
                                    console.error(err);
                                    router.visit(`/invitations/${invitation.token}`, {
                                        method: "get",
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }
                            }
                        }} className="btn main-btn shadow">수락</button>
                        <button onClick={() => {
                            router.post(`/invitations/${invitation.token}/decline`);
                        }} className="btn bg-gray-100 hover:bg-gray-200 active:bg-gray-300 shadow transition-colors duration-300">거절</button>
                    </div>
                </div>
            </div>
        </>
    );
}
