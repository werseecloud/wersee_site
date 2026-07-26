<?php
declare(strict_types=1);

return [
    'supabase_url' => 'https://PROJECT_REF.supabase.co',
    'supabase_publishable_key' => '',
    'allowed_origins' => [
        'https://wersee.com',
        'https://www.wersee.com',
    ],
    'storage_root' => __DIR__ . '/storage',
    'max_upload_bytes' => 128 * 1024 * 1024,
];
