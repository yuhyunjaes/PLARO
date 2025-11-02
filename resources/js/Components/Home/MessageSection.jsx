import { MessagesData } from "./HomeData.js";

export default function MessageSection() {
    const length = MessagesData.length;

    const gridClass =`sm:grid-cols-${length}`;

    return (
        <div className="w-full bg-white dark:bg-[#0d1117]">
            <div className="container mx-auto py-16 gap-10 flex flex-col sm:flex-row">
                <div className="h-[200px] flex-1 flex items-center">
                    <div className="space-y-5 text-center sm:text-left sm-container">
                        <p className="normal-text font-semibold">최신 메시지</p>
                        <h2 className="normal-text text-4xl font-semibold">거룩한 방해</h2>
                        <span className="normal-text">
                            거룩한 방해란 하나님께서 우리의 일상에 개입하시어 당신의 초자연적인 능력을 나타내시는 것을 말합니다.
                        </span>
                    </div>
                </div>
                <div className={`h-[200px] overflow-hidden sm-container grid grid-cols-1 ${gridClass} gap-10 sm:gap-3`}>
                    {MessagesData.map((img, index) => (
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
                                    <p className="absolute text-white start-0 bottom-0 p-5 max-w-4/6">{img.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
