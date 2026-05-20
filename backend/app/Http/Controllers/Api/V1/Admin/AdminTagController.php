<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTagController extends Controller
{
    public function index(): JsonResponse
    {
        $tags = Tag::withCount('posts')->orderByDesc('posts_count')->get();

        return response()->json([
            'success' => true,
            'data'    => TagResource::collection($tags),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:tags,name'],
        ]);

        $data['slug'] = Str::slug($data['name']);

        $tag = Tag::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo tag thành công',
            'data'    => new TagResource($tag),
        ], 201);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:tags,name,' . $tag->id],
        ]);

        $data['slug'] = Str::slug($data['name']);
        $tag->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật tag thành công',
            'data'    => new TagResource($tag),
        ]);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa tag thành công',
        ]);
    }
}
