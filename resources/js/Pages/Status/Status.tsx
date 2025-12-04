import { Head } from "@inertiajs/react";
import Header from "../../Components/Header/Header";
import Footer from "../../Components/Footer/Footer";

interface AuthUser {
    id: number;
    name: string;
    email: string;
    // 필요한 다른 사용자 속성 추가
}

interface StatusProps {
    status: number;
    auth: {
        user: AuthUser | null;
    };
}

export default function Status({ status, auth }: StatusProps) {
    let message: string;

    switch(status) {
        case 404:
            message = "Not Found";
            break;
        case 419:
            message = "Page Expired";
            break;
        case 500:
            message = "Internal Server Error";
            break;
        case 503:
            message = "Service Unavailable";
            break;
        default:
            message = "Unknown Error";
    }

    return (
        <>
            <Head title={message} />

            <div className="flex flex-col h-screen bg-gray-100 dark:bg-[#0d1117]">
                <Header auth={auth} />

                <div className="w-full flex flex-col justify-center items-center flex-1">
                    <h1 className="text-6xl normal-text font-bold mb-4">{status}</h1>
                    <p className="text-gray-600 dark:text-gray-300">{message}</p>
                </div>

                <Footer />
            </div>
        </>
    );
}
