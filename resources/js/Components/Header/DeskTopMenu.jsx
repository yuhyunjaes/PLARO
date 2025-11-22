// 데스크톱에서 보여질 헤더 menuData 배열을 가져와 menuData 정보들을 삽입

import { Link } from "@inertiajs/react";
import { menuData } from "./MenuData";

export default function DesktopMenu() {
    return (
        <ul className="me-5 hidden md:flex items-center">
            {menuData.map((menu, index) => (
                <li key={index} className="li-item group relative">
                    <Link href={menu.links[0].href} className="p-3 text-gray-700 dark:text-gray-300 block link-item group-hover:text-gray-800 dark:group-hover:text-gray-100 relative after:content-[''] after:absolute after:left-3 after:bottom-2 after:w-0 group-hover:after:w-[calc(100%-(0.75rem*2))] after:transition-[width] after:duration-100 after:h-[2px] after:bg-gray-950 dark:after:bg-white">
                        {menu.title}
                    </Link>

                    <ul className="sub-menu max-h-0 group-hover:max-h-[400px] shadow-sm">
                        {menu.links.map((link, i) => (
                            <li key={i}>
                                <Link
                                    href={link.href}
                                    className="opacity-0 text-sm group-hover:opacity-100 transition-opacity duration-150 delay-150 link-item"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    );
}
