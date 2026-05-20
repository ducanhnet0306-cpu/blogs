<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        $tags = Tag::withCount(['posts' => fn ($q) => $q->where('status', 'published')])
            ->orderByDesc('posts_count')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => TagResource::collection($tags),
        ]);
    }

    public function posts(Request $request, string $slug): JsonResponse
    {
        $tag = Tag::where('slug', $slug)->firstOrFail();

        $posts = $tag->posts()
            ->with(['user', 'category', 'tags'])
            ->where('status', 'published')
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
            'tag' => new TagResource($tag),
        ]);
    }
}
