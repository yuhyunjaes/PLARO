export default function MainSection() {
    return (
        <div className="w-full relative h-[600px]">
            <div className="absolute size-full dark:bg-black/20">

                <div className="h-full container mx-auto flex items-center justify-center sm:justify-start">
                    <div className="text-center sm:text-left grid gap-5 m-0">
                        <h1 className="text-4xl md:text-5xl font-semibold hidden sm:block text-white animate-fadeInLoad">가슴에 복음이 임하게 하소서</h1>
                        <h1 className="text-4xl font-semibold block sm:hidden text-white animate-fadeInLoad">가슴에 복음이 <br/>임하게 하소서</h1>
                        <p className="text-white animate-fadeInLoad text-sm sm:text-xl">주님을 닮아가는 공동체, 주님닮음교회</p>
                        <div>
                            <button className="b-btn bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors duration-300 animate-fadeInLoad text-white">예배 안내</button>
                        </div>
                    </div>
                </div>

            </div>
            <img src="/asset/images/Home/main.jpg" alt="" className="object-cover object-center size-full"/>
        </div>
    );
}
