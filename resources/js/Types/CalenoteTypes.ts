export interface AuthUser {
    id: number;
    name: string;
    email: string;
    nationality?: string;
    timezone?: string;
}

export interface Notepads {
    id: string;
    title: string;
    content: string;
    category: string;
    created_at: string;
    liked: boolean;
}

export interface Category {
    category: string;
    count: number;
}
