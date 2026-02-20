<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@example.com');

        User::updateOrCreate(
            ['email' => $email],
            [
                'user_id' => env('ADMIN_USER_ID', 'admin'),
                'password' => env('ADMIN_PASSWORD', 'ChangeMe123!'),
                'name' => env('ADMIN_NAME', 'Administrator'),
                'nationality' => env('ADMIN_NATIONALITY', 'KR'),
                'timezone' => env('ADMIN_TIMEZONE', 'Asia/Seoul'),
                'role' => 'admin',
            ]
        );
    }
}
