<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrawledPost extends Model
{
    protected $fillable = [
        'source_url', 'title', 'excerpt', 'content',
        'thumbnail', 'seo_title', 'seo_description',
        'status', 'post_id',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
