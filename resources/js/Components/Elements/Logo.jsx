import {Link} from "@inertiajs/react";

export default function Logo({ className = "" }) {
    return (
        <Link
            href="/" className={`block w-[180px] h-auto cursor-pointer m-0 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] ${className}`}
        >
            <img src="/asset/images/Logo/Logo.png" className="w-full h-auto object-contain" alt=""/>
        </Link>
    );
}
