// 메뉴, 서브메뉴 데이터
export interface MenuLink {
    label: string;
    href: string;
}

export interface MenuItem {
    title: string;
    links: MenuLink[];
}

export const menuData: MenuItem[] =[
    {
        title: "캘린더",
        links: [
            { label: "일반", href: "/calendar/n" },
            { label: "챌린지", href: "/calendar/c" },
            { label: "디데이", href: "/calendar/d" },
        ],
    },
    {
        title: "메모장",
        links: [
            { label: "메모장", href: "/notepad" },
        ],
    },
    {
        title: "PlaroAi",
        links: [
            { label: "PlaroAi", href: "/plaroai" },
        ],
    },
    {
        title: "대시보드",
        links: [
            { label: "대시보드", href: "/dashboard" },
        ],
    },

]
