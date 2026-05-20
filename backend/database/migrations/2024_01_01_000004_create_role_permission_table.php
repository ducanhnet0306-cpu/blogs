<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng pivot: role <-> permission (nhiều-nhiều)
        // Một role có nhiều permission, một permission thuộc nhiều role
        Schema::create('role_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('permission_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['role_id', 'permission_id']); // tránh gán trùng
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permission');
    }
};
