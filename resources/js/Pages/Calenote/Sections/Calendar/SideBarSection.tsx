interface SideBarSectionProps {
    sideBar: number;
}

export default function SideBarSection({ sideBar }:SideBarSectionProps) {
    return (
        <div className="" style={{width: `${sideBar}px`}}>

        </div>
    );
}
