// CalenoteLayout.tsx
import {
    cloneElement,
    Dispatch,
    isValidElement,
    ReactNode,
    SetStateAction,
    useCallback,
    useEffect,
    useState
} from "react";
import Header from "../Components/Header/Header";
import SideBarSection from "../Pages/Calenote/Sections/SideBarSection";
import Alert from "../Components/Elements/Alert";

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

interface AlertProps {
    setAlertSwitch: Dispatch<SetStateAction<boolean>>;
    setAlertMessage: Dispatch<SetStateAction<any>>;
    setAlertType: Dispatch<SetStateAction<"success" | "danger" | "info" | "warning">>;
}

export default function CalenoteLayout({ children, auth }: CalenoteLayoutProps) {
    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth <= 640 ? 0 : 250));
    const [saveWidth, setSaveWidth] = useState<number>(250);
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [alertSwitch, setAlertSwitch] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<any>("");
    const [alertType, setAlertType] = useState<"success" | "danger" | "info" | "warning">("success");

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

    const childrenWithProps = isValidElement<AlertProps>(children)
        ? cloneElement<AlertProps>(children, {
            setAlertSwitch,
            setAlertMessage,
            setAlertType,
        })
        : children;

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
                    {alertSwitch && <Alert close={setAlertSwitch} message={alertMessage} type={alertType} width={sideBar}/>}
                    {childrenWithProps}
                </main>
            </div>
        </>
    );
}

