import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function SocialLoginButtons() {
    return (
        <div className="space-y-2 mt-4">
            <a href="/auth/google/redirect" className="btn w-full border border-gray-300 bg-white text-gray-900 flex items-center justify-center relative">
                <span className="absolute left-4 w-4 text-center">
                    <FontAwesomeIcon icon={faGoogle} />
                </span>
                <span>Google로 계속하기</span>
            </a>
            <a href="/auth/facebook/redirect" className="btn w-full border border-blue-500 bg-blue-500 text-white flex items-center justify-center relative">
                <span className="absolute left-4 w-4 text-center">
                    <FontAwesomeIcon icon={faFacebook} />
                </span>
                <span>Facebook으로 계속하기</span>
            </a>
            <a href="/auth/kakao/redirect" className="btn w-full border border-yellow-300 bg-yellow-300 text-black flex items-center justify-center relative">
                <span className="absolute left-4 w-4 text-center font-bold">K</span>
                <span>카카오로 계속하기</span>
            </a>
        </div>
    );
}
