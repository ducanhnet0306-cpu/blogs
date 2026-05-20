<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng pivot: post <-> tag (nhiều-nhiều)
        // Bảng pivot thường đặt tên theo thứ tự alphabet: post_tag
        Schema::create('post_tag', function (Blueprint $table) {
            $table->id();

            $table->foreignId('post_id')
                ->constrained()
                ->cascadeOnDelete(); // xóa post thì xóa luôn dòng này

            $table->foreignId('tag_id')
                ->constrained()
                ->cascadeOnDelete(); // xóa tag thì xóa luôn dòng này

            $table->unique(['post_id', 'tag_id']); // 1 bài không gắn trùng tag
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_tag');
    }
};
