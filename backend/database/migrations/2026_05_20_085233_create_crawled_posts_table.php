<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('crawled_posts', function (Blueprint $table) {
            $table->id();
            $table->string('source_url', 2048);
            $table->string('title', 500)->nullable();
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('thumbnail', 2048)->nullable();
            $table->string('seo_title', 500)->nullable();
            $table->text('seo_description')->nullable();
            $table->enum('status', ['pending', 'published', 'rejected'])->default('pending');
            $table->foreignId('post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawled_posts');
    }
};
