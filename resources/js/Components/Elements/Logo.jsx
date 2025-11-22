// 로고 컴포넌트

import {Link} from "@inertiajs/react";
import {useEffect} from "react";
export default function Logo({ className = "", Change = false }) {
    useEffect(() => {
        const htmlClass = document.documentElement.className;
    }, []);
    return (
        <Link
            href="/" className={`block w-[150px] h-auto cursor-pointer m-0 ${className}`}
        >
            {Change ? (
                <>
                    <img src="/asset/images/Logo/WhiteLogo.png" className="w-full h-auto object-contain block dark:hidden" alt=""/>
                    <img src="/asset/images/Logo/DarkLogo.png" className="w-full h-auto object-contain hidden dark:block" alt=""/>
                </>
            ) : (
                <>
                    <img src="/asset/images/Logo/WhiteLogo.png" className="w-full h-auto object-contain hidden dark:block" alt=""/>
                    <img src="/asset/images/Logo/DarkLogo.png" className="w-full h-auto object-contain block dark:hidden" alt=""/>
                </>
            )}
        </Link>
    );
}
