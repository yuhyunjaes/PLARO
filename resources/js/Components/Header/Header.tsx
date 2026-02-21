// 본 헤더 컴포넌트

import { Link, router } from "@inertiajs/react";
import {useEffect, useCallback, useState, useRef, SetStateAction, Dispatch} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faBars, faMessage, faUser, faEllipsisH} from "@fortawesome/free-solid-svg-icons";
import DesktopMenu from "./DeskTopMenu";
import MobileSidebar from "./MobileSidebar";
import Logo from "../Elements/Logo";
import {AuthUser} from "../../Types/PlaroAiTypes";

interface HeaderProps {
    auth: {
        user: AuthUser | null;
    };
    className?: string;
    toggle?: boolean;
    setToggle?: Dispatch<SetStateAction<boolean>>;
    check?: boolean;
}



export default function Header({ auth, className = "", toggle, setToggle, check } : HeaderProps) {
    const [sideBar, setSideBar] = useState<boolean>(false);
    const [myBox, setMyBox] = useState<boolean>(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const myBoxRef = useRef<boolean>(myBox);
    const showMenuButton = Boolean(!toggle && check);

    useEffect(() => {
        myBoxRef.current = myBox;
    }, [myBox]);

    useEffect(() => {
        const handleClickOutside = (e : any) => {
            if (myBoxRef.current && profileRef.current && !profileRef.current.contains(e.target)) {
                setMyBox(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleResize = useCallback(() => {
        if (window.innerWidth <= 768) {
            setMyBox(false)
        }
    }, [])

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    const handleLogout = async () => {
        setMyBox(false);
        router.post("/logout", {}, {
            onSuccess: () => {
                router.visit("/login", { replace: true });
            },
            onError: (err) => {
                alert('로그아웃 중 오류가 발생했습니다.');
                console.error(err);
            }
        })
    }

    return (
        <>
            <header
                className={`
                    w-full h-[70px] sticky top-0 left-0 z-[999]
                    border-b border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950
                    ${className && className}
                `}
            >
                <div className={`w-full h-full flex ${!toggle && check ? "justify-between md:justify-end" : "justify-end"} items-center px-5 md:px-12 relative`}>
                    {(!toggle && check) && (
                        <button onClick={() => {
                            setToggle?.(true)
                        }} className="normal-text text-xl block md:hidden">
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    )}

                    <Logo
                        className={`absolute top-1/2 transition-[left,transform] duration-150 ${
                            !toggle && check
                                ? "left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-12 md:translate-x-0"
                                : "left-5 md:left-12 -translate-y-1/2"
                        }`}
                    />

                    <div className="m-0 flex items-center">
                        <DesktopMenu />

                        {auth.user ? (
                            <div ref={profileRef} className="relative">
                                <button
                                    type="button"
                                    className="profile"
                                    onClick={() => setMyBox(!myBox)}
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                </button>

                                {myBox && (
                                    <div
                                        className={`
                                        absolute top-full right-0 mt-2 w-[240px] z-[20]
                                        rounded border border-gray-300 dark:border-gray-800
                                        bg-white/95 dark:bg-gray-950/95  overflow-hidden
                                    `}
                                    >
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-sm font-semibold flex items-center justify-center">
                                                    {auth.user.name.slice(0, 1)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="normal-text text-sm font-semibold truncate">{auth.user.name}</p>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{auth.user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <button type="button" onClick={handleLogout} className="w-full rounded px-3 py-2 text-sm font-semibold text-left text-red-500 hover:text-red-50 hover:bg-red-500/80 transition-colors duration-150 cursor-pointer">
                                                로그아웃
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="btn hidden md:block btn-outline-white">
                                로그인
                            </Link>
                        )}


                        <button
                            type="button"
                            className="md:hidden"
                            onClick={() => setSideBar(true)}
                        >
                            <FontAwesomeIcon icon={faEllipsisH} className="normal-text" />
                        </button>
                    </div>
                </div>
            </header>

            <MobileSidebar sideBar={sideBar} setSideBar={setSideBar} auth={auth} />
        </>
    );
}
