import {ReactNode, useState} from "react";
import { GlobalUIContext } from "./GlobalUIContext";
import {AlertsData} from "../Components/Elements/ElementsData";

interface GlobalProviderProps {
    children: ReactNode;
}

export default function GlobalProvider({ children }: GlobalProviderProps) {
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<AlertsData[]>([]);
    const [sideBar, setSideBar] = useState<number>(() =>
        window.innerWidth <= 768 ? 0 : 230
    );
    const [saveWidth, setSaveWidth] = useState<number>(230);
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    return (
        <GlobalUIContext.Provider
            value={{
                alerts,
                setAlerts,
                loading,
                setLoading,
                sideBar,
                setSideBar,
                saveWidth,
                setSaveWidth,
                sideBarToggle,
                setSideBarToggle
            }}
        >
            {children}
        </GlobalUIContext.Provider>
    );
}
