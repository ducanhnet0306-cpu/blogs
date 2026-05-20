<?php

namespace App\Observers;

use App\Models\CrawledPost;
use App\Models\Post;

class PostObserver
{
    public function deleted(Post $post): void
    {
        CrawledPost::where('post_id', $post->id)->delete();
    }
}
