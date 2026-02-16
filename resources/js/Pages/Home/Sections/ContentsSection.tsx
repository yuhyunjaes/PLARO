/*콘텐츠 소개 영역 ContentsData 배열을 이용하여 정보들을 삽입*/

import { ContentsData } from "./HomeData.js"
import {Link} from "@inertiajs/react";
export default function ContentsSection() {
    return (
        <div className="w-full bg-gray-100 dark:bg-[#0d1117]">
            <div className="container mx-auto py-16 grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-10 px-5 sm:px-0">
                <div className="col-span-full normal-text text-center font-semibold space-y-5">
                    <p>컨텐츠</p>
                    <h2 className="text-2xl md:text-4xl">아이디어, 대화, 기술이 하나로 모이다.</h2>
                </div>
                {ContentsData.map((educationMinistry, index) => (
                    <div className="card" key={index}>
                        <img src={educationMinistry.url} alt="" className="card-top"/>
                        <div className="card-body">
                            <h4 className="normal-text font-semibold text-xl">{educationMinistry.name}</h4>
                            <p className="normal-text line-clamp-1">
                                {educationMinistry.description}
                            </p>
                            <Link href={educationMinistry.link} className="b-btn main-btn card-btn text-center">
                                자세히 알아보기
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
