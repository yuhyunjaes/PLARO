import { Head, router } from '@inertiajs/react';
import MainTitleSection from "@/Components/Calenote/Notepad/MainTitleSection.jsx";
import NotepadsSection from "@/Components/Calenote/Notepad/NotepadsSection.jsx";
import { useEffect, useState} from "react";
import Loading from "@/Components/Elements/Loading.jsx";
export default function Notepad({ auth }) {
    const [notepads, setNotepads] = useState([]);
    const [loadingToggle, setLoadingToggle] = useState(false);

    useEffect(() => {
        if(notepads.length <= 0) return;
        console.log(notepads)
    }, [notepads]);

    return (
        <>
            <Head title="Notepad"/>
            <div className="size-full bg-white relative dark:bg-[#0d1117] flex flex-col pb-10 px-5 lg:px-10 overflow-x-hidden overflow-y-auto">
                <MainTitleSection />
                <NotepadsSection setLoadingToggle={setLoadingToggle} auth={auth} notepads={notepads} setNotepads={setNotepads}/>
            </div>
            <Loading Toggle={loadingToggle} />
        </>
    );
}
