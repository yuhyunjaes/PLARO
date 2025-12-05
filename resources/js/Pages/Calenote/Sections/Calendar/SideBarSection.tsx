interface SideBarSectionProps {
    sideBar: number;
}

export default function SideBarSection({ sideBar }:SideBarSectionProps) {
    return (
        <div className={`${sideBar <= 0 ? "hidden" : ""} border border-gray-300 dark:border-gray-800 rounded-xl`} style={{width: `${sideBar}px`}}>

        </div>
    );
}
