<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('roles')
            ->when($request->keyword, fn ($q) =>
                $q->where('name', 'ILIKE', "%{$request->keyword}%")
                  ->orWhere('email', 'ILIKE', "%{$request->keyword}%")
            )
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($users),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['nullable', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        if (!empty($data['role'])) {
            $role = Role::where('name', $data['role'])->first();
            $user->roles()->sync([$role->id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo người dùng thành công',
            'data'    => new UserResource($user->load('roles')),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($user->load('roles')),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'   => ['sometimes', 'string', 'max:255'],
            'email'  => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'avatar' => ['nullable', 'string'],
            'phone'  => ['nullable', 'string'],
            'role'   => ['nullable', 'exists:roles,name'],
        ]);

        $user->update($data);

        if (array_key_exists('role', $data)) {
            $role = Role::where('name', $data['role'])->first();
            $user->roles()->sync($role ? [$role->id] : []);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật người dùng thành công',
            'data'    => new UserResource($user->load('roles')),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa chính mình',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa người dùng thành công',
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,banned'],
        ]);

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể khóa chính mình',
            ], 403);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công',
            'data'    => new UserResource($user),
        ]);
    }
}
