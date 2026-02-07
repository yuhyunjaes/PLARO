import { createContext, Dispatch, SetStateAction } from "react";
import {AlertsData} from "../Components/Elements/ElementsData";

export interface GlobalUIContextType {
    alerts: AlertsData[];
    loading: boolean;

    setAlerts: Dispatch<SetStateAction<AlertsData[]>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
}

export const GlobalUIContext =
    createContext<GlobalUIContextType | null>(null);
