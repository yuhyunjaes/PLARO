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
    message: string;
}

export default function Status({ status, auth, message }: StatusProps) {
    let errorMessage: string;

    switch (status) {
        case 200:
            errorMessage = "Success";
            break;
        case 403:
            errorMessage = "Access Forbidden";
            break;
        case 404:
            errorMessage = "Not Found";
            break;
        case 410:
            errorMessage = "Gone";
            break;
        case 419:
            errorMessage = "Page Expired";
            break;
        case 500:
            errorMessage = "Internal Server Error";
            break;
        case 503:
            errorMessage = "Service Unavailable";
            break;
        default:
            errorMessage = "Unknown Error";
    }

    return (
        <>
            <Head title={errorMessage} />

            <div className="flex flex-col h-screen bg-gray-100 dark:bg-[#0d1117]">

                <div className="w-full flex flex-col justify-center items-center flex-1 space-y-4">
                    <h1 className="text-6xl normal-text font-bold">{status}</h1>
                    <p className="text-gray-600 font-semibold dark:text-gray-500">{errorMessage}</p>
                    {message ? (
                        <p className="text-gray-600 font-semibold dark:text-gray-300">{message}</p>
                    ) : ""}
                </div>

                {/*<Footer />*/}
            </div>
        </>
    );
}
