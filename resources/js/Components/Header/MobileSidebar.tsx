// 모바일에서 보여질 헤더

import { Link, router } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX, faAngleDown, faUser, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {menuData} from "./MenuData";
import {AuthUser} from "../../Types/HomeTypes";

interface MobileSidebarProps {
    sideBar: boolean;
    setSideBar: Dispatch<SetStateAction<boolean>>;
    auth: {
        user: AuthUser | null;
    };
}

export default function MobileSidebar({ sideBar, setSideBar, auth } : MobileSidebarProps) {

    const [openStates, setOpenStates] = useState<boolean[]>(menuData.map(() => false));
    const [fadeSideBar, setFadeSideBar] = useState(false);

    const toggleMenu = (index: number) => {
        setOpenStates(prev => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    };

    useEffect(() => {
        if (!sideBar) setOpenStates([]);
    }, [sideBar]);

    const handleResize = useCallback(() => {
        if (window.innerWidth >= 768) setSideBar(false);
    }, []);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    const CloseSideBar = () => {
        setFadeSideBar(true);
        setTimeout(()=> {
            setFadeSideBar(false);
            setSideBar(false);
        }, 400)
    }

    const handleLogout = () => {
        router.post("/logout", {}, {
            preserveState: false,
            preserveScroll: false,
            onSuccess: () => {
                CloseSideBar();
                window.location.replace("/login");
            },
            onError: (err) => {
                alert('로그아웃 중 오류가 발생했습니다.');
                console.error(err);
            }
        });
    };

    if (!sideBar) return null;

    return (
        <div className={`fixed top-0 left-0 w-screen h-screen z-[999] md:hidden ${fadeSideBar ? 'animate-fadeOutSideBar' : 'animate-fadeInsideBar'}`}>
            <div className="w-[calc(100%-230px)] h-full absolute top-0 left-0" onClick={CloseSideBar}></div>
            <div className="w-[230px] h-full absolute top-0 right-0 bg-white shadow dark:shadow-gray-800 dark:bg-gray-950">
                <header className="w-full px-5 h-[70px] flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
                    {!auth?.user && (
                        <Link href="/login" className="m-0 h-full flex items-center text-gray-950 dark:text-white font-semibold space-x-3">
                            <FontAwesomeIcon icon={faUser} />
                            <span>로그인</span>
                            <FontAwesomeIcon icon={faAngleRight} />
                        </Link>
                    )}

                    <button type="button" className="m-0" onClick={CloseSideBar}>
                        <FontAwesomeIcon icon={faX} className="text-gray-950 dark:text-white text-xl" />
                    </button>
                </header>

                <main className="w-full px-5 pt-3 space-y-5 h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden">
                    {auth.user && (
                        <div className="mt-2 px-1 py-1">
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-semibold flex items-center justify-center">
                                    {auth.user.name.slice(0, 1)}
                                </div>
                                <div className="min-w-0">
                                    <p className="normal-text text-xs font-semibold truncate">{auth.user.name}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{auth.user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {menuData.map((menu, index) => (
                        <div key={index} className="mt-5">
                            <button
                                type="button"
                                className="flex justify-between items-center text-gray-950 dark:text-white cursor-pointer w-full"
                                onClick={() => toggleMenu(index)}
                            >
                                <p className="font-semibold text-sm">{menu.title}</p>
                                <FontAwesomeIcon
                                    icon={faAngleDown}
                                    className={`text-sm transition-transform duration-150 ${openStates[index] ? "rotate-180" : ""}`}
                                />
                            </button>

                            <div
                                className={`overflow-hidden transition-[max-height] duration-150
                            ${openStates[index] ? "max-h-[200px]" : "max-h-0"}`}
                            >
                                {menu.links.map((link, i) => (
                                    <Link key={i} href={link.href} onClick={CloseSideBar} className="block my-2 text-gray-950 dark:text-white text-xs font-light">
                                        - {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {auth.user && (
                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full px-0 py-1 text-xs font-medium text-left text-red-500 cursor-pointer"
                            >
                                로그아웃
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
