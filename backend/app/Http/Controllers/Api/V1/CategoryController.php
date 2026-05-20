<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\PostResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->where('status', true)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => CategoryResource::collection($categories),
        ]);
    }

    public function posts(Request $request, string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $posts = $category->posts()
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
            'category' => new CategoryResource($category),
        ]);
    }
}
