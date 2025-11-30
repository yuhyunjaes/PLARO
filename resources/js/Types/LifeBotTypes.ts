export interface AuthUser {
    id: number;
    name: string;
    email: string;
}

export interface Room {
    room_id: string;
    title: string;
}

export interface Message {
    id: string | null;
    role: 'user' | 'model';
    text: string;
}

export interface Notepad {
    id: string;
    text: string;
    category?: string;
}

export interface Categories {
    room_id: string;
    category: string;
}
