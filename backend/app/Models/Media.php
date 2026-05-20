<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    protected $fillable = [
        'user_id', 'file_name', 'file_path',
        'file_type', 'file_size', 'disk', 'alt_text',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
