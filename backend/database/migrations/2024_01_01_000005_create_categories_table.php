<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            // Self-referencing: category cha → category con
            // Ví dụ: "Công nghệ" (cha) → "Laravel", "Next.js" (con)
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('categories') // tham chiếu chính bảng này
                ->nullOnDelete();           // xóa cha thì con không bị xóa, parent_id = null

            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
