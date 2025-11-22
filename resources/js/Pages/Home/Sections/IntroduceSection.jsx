// 메안페이지 소개 영역

import { IntroduceData } from "./HomeData.js";
import { useEffect, useState } from "react";
export default function IntroduceSection() {
    return (
        <div className="w-full bg-white dark:bg-[#0d1117]">
            <div className="container mx-auto py-16 gap-10 flex flex-col sm:flex-row">
                <div className="h-[200px] flex-1 flex items-center">
                    <div className="space-y-5 text-center sm:text-left w-full sm-container">
                        <p className="normal-text font-semibold">소개</p>
                        <h2 className="normal-text text-2xl md:text-4xl font-semibold">당신의 일상에 디지털을 더하다.</h2>
                        <span className="normal-text">
                            LifeHubPro는 생각과 기술, 그리고 일상을 하나로.
                        </span>
                    </div>
                </div>
                <div className={`h-[200px] overflow-hidden sm-container flex-2 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-3`}>
                    {IntroduceData.filter((item, i)=> i < 3).map((img, index) => (
                        <div className="relative overflow-hidden rounded group" key={index}>
                            <img
                                src={img.link}
                                className={`size-full object-center object-cover max-h-[200px] min-h-[180px] rounded ${
                                    img.text ? "sm:group-hover:scale-[1.2] transition-[scale] duration-150" : ""
                                }`}
                                alt="MessageSectionImg"
                            />
                            {img.text && (
                                <div className="absolute inset-0 bg-black/50 rounded translate-y-0 sm:translate-y-full group-hover:translate-y-0">
                                    <p className="absolute text-white start-0 bottom-0 p-5 max-w-5/6">{img.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
