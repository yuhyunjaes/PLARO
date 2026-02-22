export interface MarkdownTemplateItem {
    id: number;
    uuid: string;
    owner_id: number | null;
    owner_name: string | null;
    title: string;
    description: string | null;
    template_text: string;
    visibility: "private" | "public" | "unlisted";
    is_active: boolean;
    usage_count: number;
    like_count: number;
    liked: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface MarkdownTemplateCreatePayload {
    title: string;
    description: string | null;
    template_text: string;
    visibility: "private" | "public" | "unlisted";
}
