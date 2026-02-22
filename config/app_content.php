<?php

return [
    'pagination' => [
        'challenge_templates_per_page' => (int) env('APP_CONTENT_CHALLENGE_TEMPLATES_PER_PAGE', 20),
        'markdown_templates_per_page' => (int) env('APP_CONTENT_MARKDOWN_TEMPLATES_PER_PAGE', 20),
        'notepads_per_page' => (int) env('APP_CONTENT_NOTEPADS_PER_PAGE', 24),
    ],
];
