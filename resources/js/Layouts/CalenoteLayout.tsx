// CalenoteLayout.tsx
import React, {
    cloneElement,
    isValidElement, ReactElement,
    ReactNode, RefObject,
    useCallback,
    useEffect, useRef,
    useState,
} from "react";
import Header from "../Components/Header/Header";
import SideBarSection from "../Pages/Calenote/Sections/SideBarSection";
import Loading from "../Components/Elements/Loading";
import {useContext} from "react";
import {GlobalUIContext} from "../Providers/GlobalUIContext";
import Alert from "../Components/Elements/Alert";
import {ReminderData} from "../Pages/Calenote/Sections/CalenoteSectionsData";
import Reminder from "../Components/Elements/Reminder";
import {AlertsData} from "../Components/Elements/ElementsData";

// Props 타입
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

export default function CalenoteLayout({ children, auth, ...props }: CalenoteLayoutProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("CalenoteLayout must be used within GlobalProvider");
    }

    const {
        loading,
        sideBar,
        setSideBar,
        saveWidth,
        setSaveWidth
    } = ui;


    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    // 반응형 처리
    const handleResize = useCallback((): void => {
        setSideBar(prev => {
            if (window.innerWidth <= 768) {
                setSideBarToggle(false);
                return 0;
            }
            return prev === 0 ? saveWidth : prev;
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
            <Header
                toggle={sideBarToggle}
                setToggle={setSideBarToggle}
                check={sideBar < 230}
                auth={auth}
            />

            <div className="w-full h-[calc(100vh-70px)] flex">
                <SideBarSection
                    sideBarToggle={sideBarToggle}
                    setSideBarToggle={setSideBarToggle}
                    sideBar={sideBar}
                    setSideBar={setSideBar}
                />

                <main className="CalenoteLayout-container h-full flex-1 overflow-y-auto overflow-x-hidden">
                    {isValidElement(children)
                        ? cloneElement(children as ReactElement, { ...props })
                        : children}
                </main>
            </div>
            <Loading Toggle={loading} />
        </>
    );
}
