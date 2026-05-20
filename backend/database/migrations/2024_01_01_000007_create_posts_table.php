<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();

            // Quan hệ 1 chiều: post thuộc về 1 user (tác giả)
            // cascadeOnDelete: xóa user thì xóa luôn bài viết của họ
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Quan hệ 1 chiều: post thuộc về 1 category
            // nullOnDelete: xóa category thì bài viết không bị xóa, category_id = null
            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('thumbnail')->nullable();

            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();

            // SEO fields
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->string('seo_keywords')->nullable();

            $table->unsignedBigInteger('view_count')->default(0);

            $table->timestamps();
            $table->softDeletes(); // cho phép xóa mềm (trash)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
