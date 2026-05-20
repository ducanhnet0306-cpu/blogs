<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('parent')->withCount('posts')->get();

        return response()->json([
            'success' => true,
            'data'    => CategoryResource::collection($categories),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_id'   => ['nullable', 'exists:categories,id'],
            'status'      => ['boolean'],
        ]);

        $data['slug'] = Str::slug($data['name']);

        $category = Category::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Tạo danh mục thành công',
            'data'    => new CategoryResource($category),
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new CategoryResource($category->load('parent', 'children')),
        ]);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_id'   => ['nullable', 'exists:categories,id'],
            'status'      => ['boolean'],
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật danh mục thành công',
            'data'    => new CategoryResource($category),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa danh mục thành công',
        ]);
    }
}
