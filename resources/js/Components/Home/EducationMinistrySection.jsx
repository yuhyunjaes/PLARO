import { EducationMinistryData } from "./HomeData.js"
export default function EducationMinistrySection() {
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-950">
            <div className="container mx-auto py-16 grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-10 px-5 sm:px-0">
                <div className="col-span-1 md:col-span-3 sm:col-span-2 normal-text text-center font-semibold space-y-5">
                    <p>한 교회,</p>
                    <h2 className="text-4xl">다양한 교육 공동체.</h2>
                </div>
                {EducationMinistryData.map((educationMinistry, index) => (
                    <div className="card" key={index}>
                        <img src={educationMinistry.url} alt="" className="card-top"/>
                        <div className="card-body">
                            <h4 className="normal-text font-semibold text-xl">{educationMinistry.name}</h4>
                            <p className="normal-text">{educationMinistry.description}</p>
                            <button className="b-btn w-full bg-blue-500 hover:bg-teal-700 active:bg-teal-800 transition-colors duration-300 text-white">예배 안내</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
