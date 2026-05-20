<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'category_id', 'title', 'slug', 'excerpt',
        'content', 'thumbnail', 'status', 'is_featured',
        'published_at', 'seo_title', 'seo_description', 'seo_keywords',
    ];

    protected $casts = [
        'is_featured'  => 'boolean',
        'published_at' => 'datetime',
    ];

    // Post thuộc về 1 user (tác giả)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Post thuộc về 1 category
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // Post <-> Tag (nhiều-nhiều) qua bảng pivot post_tag
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    // Post có nhiều comment
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Chỉ lấy comment đã duyệt ở public
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('status', 'approved');
    }
}
