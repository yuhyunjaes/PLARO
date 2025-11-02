import Logo from "../Elements/Logo.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube, faInstagram } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
    return (
        <footer className="w-full h-auto py-16 bg-white dark:bg-[#0d1117]">
            <div className="w-full px-5 sm:px-12">
                <div className="w-full h-[70px] flex justify-between">
                    <Logo className="grayscale-100"/>
                    <div className="m-0 flex items-center space-x-3">
                        <a href="https://youtube.com/@joodamch?si=9ZPA18TRtH9v5ePu" target="_blank" rel="noopener noreferrer" className="size-8 rounded-full text-white dark:text-black bg-red-700 hover:bg-red-800 active:bg-red-900  flex items-center justify-center transition-all duration-100">
                            <FontAwesomeIcon icon={faYoutube} />
                        </a>
                        <a href="https://www.instagram.com/joodamchurch?igsh=bW5zOHZ1aWFyank3" target="_blank" rel="noopener noreferrer" className="size-8 rounded-full text-white dark:text-black bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#962fbf] hover:grayscale-30 transition-all duration-100  flex items-center justify-center">
                            <FontAwesomeIcon icon={faInstagram} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
