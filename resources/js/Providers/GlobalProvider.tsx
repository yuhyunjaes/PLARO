import {ReactNode, useState} from "react";
import { GlobalUIContext } from "./GlobalUIContext";
import {AlertsData} from "../Components/Elements/ElementsData";

interface GlobalProviderProps {
    children: ReactNode;
}

export default function GlobalProvider({ children }: GlobalProviderProps) {
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<AlertsData[]>([]);

    return (
        <GlobalUIContext.Provider
            value={{
                alerts,
                setAlerts,
                loading,
                setLoading
            }}
        >
            {children}
        </GlobalUIContext.Provider>
    );
}
