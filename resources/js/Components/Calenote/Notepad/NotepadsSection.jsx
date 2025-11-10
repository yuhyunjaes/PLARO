import {useCallback, useEffect} from "react";

export default function NotepadsSection({setNotepads, auth, setLoadingToggle, notepads }) {
    const getNotepads = useCallback(async () => {
        if(!auth.user) return;
            setLoadingToggle(true);
        try {
            const res = await axios.get("/api/notepads");
            if(res.data.success) {
                setNotepads(res.data.notepads);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingToggle(false);
        }
    }, [auth]);

    useEffect(() => {
        getNotepads();
    }, [getNotepads]);

    return (
        <div className="flex-1 grid grid-cols-5 gap-5">
            {notepads.map((notepad, index) => (
                <div key={index} className="h-[280px] bg-blue-500 rounded-l rounded-r-2xl relative after:w-[10px] after:h-[calc(100%+6px)] after:bg-gray-200 after:absolute after:right-[20px] after:top-[-3px] after:rounded">
                    <p className="text-white absolute font-semibold p-5">{notepad.title}</p>
                </div>
            ))}
        </div>
    );
}
