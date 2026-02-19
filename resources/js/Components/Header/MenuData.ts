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
        title: "캘리노트",
        links: [
            { label: "대시보드", href: "/calenote" },
            { label: "메모장", href: "/calenote/notepad" },
            { label: "캘린더", href: "/calenote/calendar" },
        ],
    },
    {
        title: "PlaroAi",
        links: [
            { label: "PlaroAi", href: "/plaroai" },
        ],
    },
    {
        title: "소식/자료",
        links: [
            { label: "라이프 소식", href: "/news" },
            { label: "자유게시판", href: "/calendar" },
            { label: "포토 갤러리", href: "/gallery" },
        ],
    },
]
