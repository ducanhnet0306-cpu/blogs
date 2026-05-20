<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@blog.com'],
            [
                'name'     => 'Super Admin',
                'password' => bcrypt('password'),
                'status'   => 'active',
            ]
        );

        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole) {
            $admin->roles()->syncWithoutDetaching([$superAdminRole->id]);
        }
    }
}
