import { useCallback, useEffect, useState } from "react";
import SideBarSection from "@/Components/Calenote/SideBarSection.jsx";
import Header from "@/Components/Header/Header.jsx";

export default function CalenoteLayout({ children, auth }) {
    const [sideBar, setSideBar] = useState(() => (window.innerWidth <= 640 ? 0 : 250));
    const [saveWidth, setSaveWidth] = useState(250);
    const [sideBarToggle, setSideBarToggle] = useState(false);

    const handleResize = useCallback(() => {
        setSideBar((prev) => {
            if (window.innerWidth <= 640) {
                setSideBarToggle(false)
                return 0;
            } else {
                return prev === 0 ? saveWidth : prev;
            }
        });
    }, [saveWidth]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (sideBar > 0) {
            setSaveWidth(sideBar);
        }
    }, [sideBar]);

    return (
        <>
            <Header toggle={sideBarToggle} setToggle={setSideBarToggle} check={(sideBar < 250)} auth={auth} />
            <div className="w-full h-[calc(100vh-70px)] flex transition-[width] duration-300">
                <SideBarSection sideBarToggle={sideBarToggle} setSideBarToggle={setSideBarToggle}  sideBar={sideBar} setSideBar={setSideBar} />
                <main
                    className="transition-[width] duration-300 h-full flex-1"
                >
                    {children}
                </main>
            </div>
        </>
    );
}
