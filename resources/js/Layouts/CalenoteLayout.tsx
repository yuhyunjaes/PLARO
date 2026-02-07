// CalenoteLayout.tsx
import React, {
    cloneElement,
    isValidElement, ReactElement,
    ReactNode,
    useCallback,
    useEffect,
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
        alerts,
        setAlerts,
        loading,
    } = ui;


    // 사이드바 상태
    const [sideBar, setSideBar] = useState<number>(() =>
        window.innerWidth <= 640 ? 0 : 250
    );
    const [saveWidth, setSaveWidth] = useState<number>(250);
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    // 반응형 처리
    const handleResize = useCallback((): void => {
        setSideBar(prev => {
            if (window.innerWidth <= 640) {
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

    function formatDateKey(date: Date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    }

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
                    {alerts.length > 0 && (
                        <Alert
                            key={formatDateKey(alerts[0]!.id)}
                            setAlerts={setAlerts}
                            type={alerts[0]!.type}
                            message={alerts[0]!.message}
                            width={sideBar}
                        />
                    )}
                    {isValidElement(children)
                        ? cloneElement(children as ReactElement, { ...props })
                        : children}
                </main>
            </div>
            <Loading Toggle={loading} />
        </>
    );
}
