// 푸터 컴포넌트

import Logo from "../Elements/Logo.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faInstagram } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
    return (
        <footer className="w-full h-auto py-16 bg-gray-300 dark:bg-black border-t border-gray-200 dark:border-gray-800">
            <div className="px-5 sm:px-12">
                <div className="h-auto md:h-[70px] flex justify-center md:justify-between items-center flex-wrap">
                    <Logo/>
                    <div className="m-0 w-full md:w-auto justify-center md:justify-normal flex items-center space-x-3">
                        {/* GitHub */}
                        <a
                            href="https://github.com/yuhyunjaes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-8 rounded-full text-white dark:text-gray-950 bg-gray-950 hover:bg-gray-900 active:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:active:bg-gray-200 flex items-center justify-center transition-all duration-100"
                        >
                            <FontAwesomeIcon icon={faGithub} />
                        </a>

                        {/* Instagram */}
                        <a
                            href="https://www.instagram.com/yuhj00/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-8 rounded-full text-white bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#962fbf] hover:grayscale-30 transition-all duration-100 flex items-center justify-center dark:opacity-80 dark:hover:opacity-100"
                        >
                            <FontAwesomeIcon icon={faInstagram} />
                        </a>
                    </div>

                </div>
                <div className="text-center">
                    <p className="normal-text">© 2025 LifeHubPro. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
