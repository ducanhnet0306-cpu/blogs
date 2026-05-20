<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    protected $fillable = [
        'post_id', 'user_id', 'parent_id',
        'name', 'email', 'content', 'status',
    ];

    // Comment thuộc về 1 bài viết
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    // Comment có thể thuộc về 1 user đăng nhập (nullable)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Comment con thuộc về comment cha (self-referencing)
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    // Comment cha có nhiều reply
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}
