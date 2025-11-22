// 본 헤더 컴포넌트

import { Link, router } from "@inertiajs/react";
import {useEffect, useCallback, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faBars, faMessage, faUser, faEllipsisH} from "@fortawesome/free-solid-svg-icons";
import DesktopMenu from "./DesktopMenu";
import MobileSidebar from "./MobileSidebar";
import Logo from "../Elements/Logo.jsx";

export default function Header({ auth, className = "", toggle, setToggle, check }) {
    const [sideBar, setSideBar] = useState(false);
    const [myBox, setMyBox] = useState(false);
    const profileRef = useRef(null);
    const myBoxRef = useRef(myBox);

    useEffect(() => {
        myBoxRef.current = myBox;
    }, [myBox])

    const handleClickOutside = useCallback((e) => {
        if (myBoxRef.current && profileRef.current && !profileRef.current.contains(e.target)) {
            setMyBox(false);
        }
    }, []);

    useEffect(() => {

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);


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
        router.post("/logout", {}, {
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
                <div className="w-full h-full flex justify-between items-center px-5 sm:px-12">
                    {(!toggle && check) && (
                        <button onClick={() => {setToggle(true)}} className="normal-text text-xl block sm:hidden">
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    )}
                    <Logo />

                    <div className="m-0 flex items-center">
                        <DesktopMenu />

                        {auth.user ? (
                            <div ref={profileRef} className="relative">
                                <button
                                    className="profile"
                                    onClick={() => setMyBox(!myBox)}
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                </button>

                                {myBox && (
                                    <div
                                        className={`
                                        absolute overflow-hidden w-[200px] bg-white dark:bg-gray-950 top-[calc(100%+10px)] right-0
                                        shadow-md rounded-md
                                        border border-gray-300 dark:border-gray-800
                                    `}
                                    >
                                        <div className="p-5 space-y-5">
                                            <Link className="py-2 block">
                                                <span className="normal-text font-semibold ms-2">마이페이지</span>
                                            </Link>
                                            <button onClick={handleLogout} className="btn w-full main-btn">로그아웃</button>
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
