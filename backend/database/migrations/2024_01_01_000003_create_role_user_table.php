<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng pivot: user <-> role (nhiều-nhiều)
        // Một user có thể có nhiều role, một role gán cho nhiều user
        Schema::create('role_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('role_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'role_id']); // tránh gán trùng
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_user');
    }
};
