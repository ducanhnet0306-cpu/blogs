<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::with(['user', 'category', 'tags'])
            ->when($request->keyword, fn ($q) =>
                $q->where('title', 'ILIKE', "%{$request->keyword}%")
            )
            ->when($request->status, fn ($q) =>
                $q->where('status', $request->status)
            )
            ->when($request->category_id, fn ($q) =>
                $q->where('category_id', $request->category_id)
            )
            ->latest()
            ->paginate($request->per_page ?? 15);

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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id'     => ['nullable', 'exists:categories,id'],
            'title'           => ['required', 'string', 'max:255'],
            'excerpt'         => ['nullable', 'string'],
            'content'         => ['required', 'string'],
            'thumbnail'       => ['nullable', 'string'],
            'status'          => ['required', 'in:draft,published,archived'],
            'is_featured'     => ['boolean'],
            'published_at'    => ['nullable', 'date'],
            'seo_title'       => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords'    => ['nullable', 'string'],
            'tag_ids'         => ['nullable', 'array'],
            'tag_ids.*'       => ['exists:tags,id'],
        ]);

        $data['user_id'] = auth()->id();
        $data['slug']    = Str::slug($data['title']);

        // Tránh slug trùng
        $originalSlug = $data['slug'];
        $count = 1;
        while (Post::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $originalSlug . '-' . $count++;
        }

        // Tự động set published_at khi xuất bản
        if (($data['status'] ?? '') === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $post = Post::create($data);

        if (!empty($data['tag_ids'])) {
            $post->tags()->sync($data['tag_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo bài viết thành công',
            'data'    => new PostResource($post->load(['user', 'category', 'tags'])),
        ], 201);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new PostResource($post->load(['user', 'category', 'tags'])),
        ]);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $data = $request->validate([
            'category_id'     => ['nullable', 'exists:categories,id'],
            'title'           => ['sometimes', 'string', 'max:255'],
            'excerpt'         => ['nullable', 'string'],
            'content'         => ['sometimes', 'string'],
            'thumbnail'       => ['nullable', 'string'],
            'status'          => ['sometimes', 'in:draft,published,archived'],
            'is_featured'     => ['boolean'],
            'published_at'    => ['nullable', 'date'],
            'seo_title'       => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords'    => ['nullable', 'string'],
            'tag_ids'         => ['nullable', 'array'],
            'tag_ids.*'       => ['exists:tags,id'],
        ]);

        if (isset($data['title'])) {
            $newSlug = Str::slug($data['title']);
            if ($newSlug !== $post->slug) {
                $originalSlug = $newSlug;
                $count = 1;
                while (Post::where('slug', $newSlug)->where('id', '!=', $post->id)->exists()) {
                    $newSlug = $originalSlug . '-' . $count++;
                }
                $data['slug'] = $newSlug;
            }
        }

        // Tự động set published_at khi chuyển sang published
        if (($data['status'] ?? '') === 'published' && empty($post->published_at)) {
            $data['published_at'] = now();
        }

        $post->update($data);

        if (array_key_exists('tag_ids', $data)) {
            $post->tags()->sync($data['tag_ids'] ?? []);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bài viết thành công',
            'data'    => new PostResource($post->load(['user', 'category', 'tags'])),
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa bài viết thành công',
        ]);
    }

    public function publish(Post $post): JsonResponse
    {
        $post->update([
            'status'       => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng bài viết',
            'data'    => new PostResource($post->load(['user', 'category', 'tags'])),
        ]);
    }

    public function archive(Post $post): JsonResponse
    {
        $post->update(['status' => 'archived']);

        return response()->json([
            'success' => true,
            'message' => 'Đã lưu trữ bài viết',
            'data'    => new PostResource($post->load(['user', 'category', 'tags'])),
        ]);
    }
}
