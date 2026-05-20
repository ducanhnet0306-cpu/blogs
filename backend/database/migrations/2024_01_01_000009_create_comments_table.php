<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();

            // Comment thuộc về 1 bài viết
            $table->foreignId('post_id')
                ->constrained()
                ->cascadeOnDelete();

            // Comment có thể là của user đăng nhập (nullable nếu guest)
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // Self-referencing: comment cha → reply con
            // Ví dụ: comment gốc (parent_id null) → các reply (parent_id = comment gốc)
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('comments')
                ->cascadeOnDelete(); // xóa comment cha thì xóa luôn các reply

            // Cho phép guest comment (không cần đăng nhập)
            $table->string('name')->nullable();  // tên guest
            $table->string('email')->nullable(); // email guest

            $table->text('content');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
