// 메인페이지 메인 영역
export default function MainSection() {
    return (
        <div className="w-full relative h-[600px]">
            <div className="absolute size-full bg-black/30">
                <div className="h-full container mx-auto flex items-center justify-center sm:justify-start">
                    <div className="text-center sm:text-left grid gap-5 m-0">
                        <h1 className="text-4xl md:text-5xl font-semibold hidden sm:block text-white animate-fadeInLoad">
                            삶을 디지털과 연결하다.
                        </h1>
                        <h1 className="text-4xl font-semibold block sm:hidden text-white animate-fadeInLoad">
                            삶을 디지털과 <br/>연결하다.
                        </h1>
                        <p className="text-white/90 animate-fadeInLoad text-sm sm:text-xl">
                            아이디어와 기술, 그리고 사람을 하나로 잇는 디지털 허브.
                        </p>
                        <div>
                            <button className="b-btn main-btn animate-fadeInLoad">
                                지금 시작하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <img src="/asset/images/Home/main.jpg" alt="" className="object-cover object-center size-full"/>
        </div>
    );
}
