<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'parent_id', 'status'];

    protected $casts = ['status' => 'boolean'];

    // Category con thuộc về category cha (self-referencing)
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Category cha có nhiều category con
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    // Category có nhiều bài viết
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
