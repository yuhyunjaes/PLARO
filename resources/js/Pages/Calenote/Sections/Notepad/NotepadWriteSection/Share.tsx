import {forwardRef, useCallback, useContext} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faEnvelope, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import {AlertsData} from "../../../../../Components/Elements/ElementsData";
import {GlobalUIContext} from "../../../../../Providers/GlobalUIContext";

interface ShareProps {
    uuid: string;
}

const Share = forwardRef<HTMLDivElement, ShareProps>(
    ({ uuid }, ref) => {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading
    } = ui;

    const sendEmail = useCallback(async () => {
        if(!uuid) return;
        setLoading(true);
        try {
            const res = await axios.post(`/api/notepads/${uuid}/share/email`);
            const alertData:AlertsData = {
                id: new Date(),
                message: res.data.message,
                type: res.data.type
            }
            setAlerts(pre => [...pre, alertData]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    return (
        <div
            ref={ref}
            className="absolute z-[2] top-9 right-10 w-[160px] p-2 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 shadow-md rounded-xl"
        >
            <button onClick={sendEmail} className="btn text-xs transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                <FontAwesomeIcon icon={faEnvelope}/>
                <span>
                            메일 공유
                        </span>
            </button>
        </div>
    );
});

export default Share;
