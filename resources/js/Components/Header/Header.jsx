import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import DesktopMenu from "./DesktopMenu";
import MobileSidebar from "./MobileSidebar";
import Logo from "../Elements/Logo.jsx";

export default function Header({ auth }) {
    const [sideBar, setSideBar] = useState(false);

    return (
        <>
            <header
                className="
            w-full h-[70px] sticky top-0 left-0 z-[999]
            animate-opacityLoad transition-opacity duration-300
            border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 ">

            <div className="w-full h-full flex justify-between items-center px-5 sm:px-12">
                    <Logo/>

                    <div className="m-0 flex items-center">
                        <DesktopMenu />

                        {!auth?.user && (
                            <Link href="/login" className="btn hidden md:block btn-outline-white">
                                로그인
                            </Link>
                        )}

                        <button
                            className="block md:hidden text-xl"
                            onClick={() => setSideBar(true)}
                        >
                            <FontAwesomeIcon className="text-gray-950 dark:text-white" icon={faBars} />
                        </button>
                    </div>
                </div>
            </header>

            <MobileSidebar sideBar={sideBar} setSideBar={setSideBar} auth={auth} />
        </>
    );
}
