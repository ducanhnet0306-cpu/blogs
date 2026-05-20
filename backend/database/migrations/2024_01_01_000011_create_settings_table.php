<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();         // 'site_name', 'site_logo', 'posts_per_page'
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // 'string', 'boolean', 'integer', 'json'
            $table->string('group')->nullable();      // 'general', 'seo', 'social', 'mail'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
