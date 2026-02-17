import { createContext, Dispatch, SetStateAction } from "react";
import {AlertsData} from "../Components/Elements/ElementsData";

export interface GlobalUIContextType {
    alerts: AlertsData[];
    loading: boolean;
    sideBar: number;
    saveWidth: number;

    setAlerts: Dispatch<SetStateAction<AlertsData[]>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setSideBar: Dispatch<SetStateAction<number>>;
    setSaveWidth: Dispatch<SetStateAction<number>>;
}

export const GlobalUIContext =
    createContext<GlobalUIContextType | null>(null);
