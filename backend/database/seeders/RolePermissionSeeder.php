<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // --- Tạo permissions ---
        $permissions = [
            // Bài viết
            ['name' => 'post.view',    'display_name' => 'Xem bài viết',    'group' => 'post'],
            ['name' => 'post.create',  'display_name' => 'Tạo bài viết',    'group' => 'post'],
            ['name' => 'post.update',  'display_name' => 'Sửa bài viết',    'group' => 'post'],
            ['name' => 'post.delete',  'display_name' => 'Xóa bài viết',    'group' => 'post'],
            ['name' => 'post.publish', 'display_name' => 'Đăng bài viết',   'group' => 'post'],

            // Danh mục
            ['name' => 'category.view',   'display_name' => 'Xem danh mục',  'group' => 'category'],
            ['name' => 'category.create', 'display_name' => 'Tạo danh mục',  'group' => 'category'],
            ['name' => 'category.update', 'display_name' => 'Sửa danh mục',  'group' => 'category'],
            ['name' => 'category.delete', 'display_name' => 'Xóa danh mục',  'group' => 'category'],

            // Tag
            ['name' => 'tag.view',   'display_name' => 'Xem tag',  'group' => 'tag'],
            ['name' => 'tag.create', 'display_name' => 'Tạo tag',  'group' => 'tag'],
            ['name' => 'tag.update', 'display_name' => 'Sửa tag',  'group' => 'tag'],
            ['name' => 'tag.delete', 'display_name' => 'Xóa tag',  'group' => 'tag'],

            // Comment
            ['name' => 'comment.view',    'display_name' => 'Xem bình luận',    'group' => 'comment'],
            ['name' => 'comment.approve', 'display_name' => 'Duyệt bình luận',  'group' => 'comment'],
            ['name' => 'comment.reject',  'display_name' => 'Từ chối bình luận','group' => 'comment'],
            ['name' => 'comment.delete',  'display_name' => 'Xóa bình luận',    'group' => 'comment'],

            // User
            ['name' => 'user.view',   'display_name' => 'Xem người dùng',  'group' => 'user'],
            ['name' => 'user.create', 'display_name' => 'Tạo người dùng',  'group' => 'user'],
            ['name' => 'user.update', 'display_name' => 'Sửa người dùng',  'group' => 'user'],
            ['name' => 'user.delete', 'display_name' => 'Xóa người dùng',  'group' => 'user'],

            // Role
            ['name' => 'role.view',   'display_name' => 'Xem vai trò',  'group' => 'role'],
            ['name' => 'role.create', 'display_name' => 'Tạo vai trò',  'group' => 'role'],
            ['name' => 'role.update', 'display_name' => 'Sửa vai trò',  'group' => 'role'],
            ['name' => 'role.delete', 'display_name' => 'Xóa vai trò',  'group' => 'role'],

            // Cài đặt
            ['name' => 'setting.view',   'display_name' => 'Xem cài đặt',  'group' => 'setting'],
            ['name' => 'setting.update', 'display_name' => 'Sửa cài đặt',  'group' => 'setting'],

            // Media
            ['name' => 'media.view',   'display_name' => 'Xem media',  'group' => 'media'],
            ['name' => 'media.upload', 'display_name' => 'Upload media','group' => 'media'],
            ['name' => 'media.delete', 'display_name' => 'Xóa media',  'group' => 'media'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // --- Tạo roles và gán permissions ---

        // Super Admin: toàn quyền
        $superAdmin = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['display_name' => 'Super Admin', 'description' => 'Toàn quyền hệ thống']
        );
        $superAdmin->permissions()->sync(Permission::pluck('id'));

        // Admin: quản lý nội dung và user, không quản lý role
        $admin = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Admin', 'description' => 'Quản trị viên']
        );
        $adminPerms = Permission::whereNotIn('group', ['role'])->pluck('id');
        $admin->permissions()->sync($adminPerms);

        // Editor: tạo, sửa, duyệt bài + comment
        $editor = Role::firstOrCreate(
            ['name' => 'editor'],
            ['display_name' => 'Editor', 'description' => 'Biên tập viên']
        );
        $editorPerms = Permission::whereIn('name', [
            'post.view', 'post.create', 'post.update', 'post.publish',
            'category.view', 'tag.view', 'tag.create',
            'comment.view', 'comment.approve', 'comment.reject', 'comment.delete',
            'media.view', 'media.upload',
        ])->pluck('id');
        $editor->permissions()->sync($editorPerms);

        // Author: chỉ tạo và sửa bài của mình
        $author = Role::firstOrCreate(
            ['name' => 'author'],
            ['display_name' => 'Author', 'description' => 'Tác giả']
        );
        $authorPerms = Permission::whereIn('name', [
            'post.view', 'post.create', 'post.update',
            'category.view', 'tag.view',
            'media.view', 'media.upload',
        ])->pluck('id');
        $author->permissions()->sync($authorPerms);

        // User: chỉ đọc
        $user = Role::firstOrCreate(
            ['name' => 'user'],
            ['display_name' => 'User', 'description' => 'Người dùng thường']
        );
        $user->permissions()->sync(
            Permission::whereIn('name', ['post.view', 'category.view', 'tag.view'])->pluck('id')
        );
    }
}
