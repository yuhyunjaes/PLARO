import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faBookmark, faListUl, faSearch } from "@fortawesome/free-solid-svg-icons";
import FormInput from "@/Components/Elements/FormInput.jsx";
export default function MainTitleSection() {
    return (
        <div className="flex justify-between items-center flex-wrap sticky top-0 bg-white dark:bg-[#0d1117] pt-10">
            <h1 className="text-2xl sm:text-4xl font-semibold normal-text mb-5">
                오늘의 생각을 기록해보세요.
            </h1>

            <div className="space-x-2 flex flex-wrap">
                <button className="size-12 mb-5 bg-blue-500 rounded-full">
                    <FontAwesomeIcon icon={faListUl} className="text-white" />
                </button>
                <button className="size-12 mb-5 border border-gray-200 dark:border-gray-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-150">
                    <FontAwesomeIcon icon={faBookmark} className="normal-text" />
                </button>
                <button className="size-12 mb-5 border border-gray-200 dark:border-gray-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-150">
                    <FontAwesomeIcon icon={faPlus} className="normal-text" />
                </button>
                <div className="flex mb-5">
                    <input type="text" className="border container h-[3rem] border-gray-200 dark:border-gray-800 rounded-l-3xl pl-3 text-sm font-semibold placeholder:text-gray-950 dark:placeholder:text-white" placeholder="메모 검색"/>
                    <button className="bg-blue-500 pl-3 pr-5 rounded-r-3xl text-sm text-white font-semibold">
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </div>
            </div>
        </div>
    );
}
