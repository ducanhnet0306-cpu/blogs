<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();

            // Ai upload file này
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type');           // 'image/jpeg', 'image/png', 'application/pdf'
            $table->unsignedBigInteger('file_size'); // bytes
            $table->string('disk')->default('public'); // 'local', 's3', 'cloudinary'
            $table->string('alt_text')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
