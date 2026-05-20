<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::with(['user', 'category', 'tags'])
            ->where('status', 'published')
            ->when($request->keyword, fn ($q) =>
                $q->where(fn ($q) =>
                    $q->where('title', 'ILIKE', "%{$request->keyword}%")
                      ->orWhere('excerpt', 'ILIKE', "%{$request->keyword}%")
                )
            )
            ->when($request->category, fn ($q) =>
                $q->whereHas('category', fn ($q) => $q->where('slug', $request->category))
            )
            ->when($request->tag, fn ($q) =>
                $q->whereHas('tags', fn ($q) => $q->where('slug', $request->tag))
            )
            ->when($request->featured, fn ($q) => $q->where('is_featured', true))
            ->latest('published_at')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data'    => PostResource::collection($posts),
            'meta'    => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'per_page'     => $posts->perPage(),
                'total'        => $posts->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $post = Post::with(['user', 'category', 'tags'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        // Tăng view count
        $post->increment('view_count');

        return response()->json([
            'success' => true,
            'data'    => new PostResource($post),
        ]);
    }
}
