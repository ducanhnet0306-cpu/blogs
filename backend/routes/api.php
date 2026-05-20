<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\TagController;
use App\Http\Controllers\Api\V1\Admin\AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\AdminPostController;
use App\Http\Controllers\Api\V1\Admin\AdminTagController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Auth public ──────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login',    [AuthController::class, 'login']);
    });

    // ── Public blog ──────────────────────────────────────────
    Route::get('/posts',                          [PostController::class, 'index']);
    Route::get('/posts/{slug}',                   [PostController::class, 'show']);
    Route::get('/categories',                     [CategoryController::class, 'index']);
    Route::get('/categories/{slug}/posts',        [CategoryController::class, 'posts']);
    Route::get('/tags',                           [TagController::class, 'index']);
    Route::get('/tags/{slug}/posts',              [TagController::class, 'posts']);

    // ── Protected (cần token) ─────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        // ── Admin ─────────────────────────────────────────────
        Route::prefix('admin')->group(function () {

            // Posts
            Route::get('/posts',                    [AdminPostController::class, 'index']);
            Route::post('/posts',                   [AdminPostController::class, 'store']);
            Route::get('/posts/{post}',             [AdminPostController::class, 'show']);
            Route::put('/posts/{post}',             [AdminPostController::class, 'update']);
            Route::delete('/posts/{post}',          [AdminPostController::class, 'destroy']);
            Route::patch('/posts/{post}/publish',   [AdminPostController::class, 'publish']);
            Route::patch('/posts/{post}/archive',   [AdminPostController::class, 'archive']);

            // Categories
            Route::get('/categories',               [AdminCategoryController::class, 'index']);
            Route::post('/categories',              [AdminCategoryController::class, 'store']);
            Route::get('/categories/{category}',    [AdminCategoryController::class, 'show']);
            Route::put('/categories/{category}',    [AdminCategoryController::class, 'update']);
            Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

            // Tags
            Route::get('/tags',                     [AdminTagController::class, 'index']);
            Route::post('/tags',                    [AdminTagController::class, 'store']);
            Route::put('/tags/{tag}',               [AdminTagController::class, 'update']);
            Route::delete('/tags/{tag}',            [AdminTagController::class, 'destroy']);

            // Users
            Route::get('/users',                    [AdminUserController::class, 'index']);
            Route::post('/users',                   [AdminUserController::class, 'store']);
            Route::get('/users/{user}',             [AdminUserController::class, 'show']);
            Route::put('/users/{user}',             [AdminUserController::class, 'update']);
            Route::delete('/users/{user}',          [AdminUserController::class, 'destroy']);
            Route::patch('/users/{user}/status',    [AdminUserController::class, 'updateStatus']);
        });
    });
});
