import { createContext, Dispatch, SetStateAction } from "react";
import {AlertsData} from "../Components/Elements/ElementsData";

export interface GlobalUIContextType {
    alerts: AlertsData[];
    loading: boolean;
    sideBar: number;
    saveWidth: number;
    sideBarToggle: boolean;

    setAlerts: Dispatch<SetStateAction<AlertsData[]>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setSideBar: Dispatch<SetStateAction<number>>;
    setSaveWidth: Dispatch<SetStateAction<number>>;
    setSideBarToggle: Dispatch<SetStateAction<boolean>>;
}

export const GlobalUIContext =
    createContext<GlobalUIContextType | null>(null);
