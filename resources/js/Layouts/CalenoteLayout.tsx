// CalenoteLayout.tsx
import { ReactNode, useCallback, useEffect, useState } from "react";
import Header from "../Components/Header/Header";
import SideBarSection from "../Pages/Calenote/Sections/SideBarSection";

// Props 타입 정의
export interface AuthUser {
    id: number;
    name: string;
    email: string;
}


interface CalenoteLayoutProps {
    children: ReactNode;
    auth: {
        user: AuthUser | null;
    };
}

export default function CalenoteLayout({ children, auth }: CalenoteLayoutProps) {
    const [sideBar, setSideBar] = useState<number>(() => (window.innerWidth <= 640 ? 0 : 250));
    const [saveWidth, setSaveWidth] = useState<number>(250);
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const handleResize: ()=> void = useCallback(() => {
        setSideBar((prev: number):number => {
            if (window.innerWidth <= 640) {
                setSideBarToggle(false);
                return 0;
            } else {
                return prev === 0 ? saveWidth : prev;
            }
        });
    }, [saveWidth]);

    useEffect((): ()=> void => {
        window.addEventListener("resize", handleResize);
        handleResize();
        return ():void => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (sideBar > 0) {
            setSaveWidth(sideBar);
        }
    }, [sideBar]);

    return (
        <>
            <Header
                toggle={sideBarToggle}
                setToggle={setSideBarToggle}
                check={sideBar < 250}
                auth={auth}
            />
            <div className="w-full h-[calc(100vh-70px)] flex transition-[width] duration-300">
                <SideBarSection
                    sideBarToggle={sideBarToggle}
                    setSideBarToggle={setSideBarToggle}
                    sideBar={sideBar}
                    setSideBar={setSideBar}
                />
                <main className="transition-[width] duration-300 h-full flex-1 overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>
        </>
    );
}
