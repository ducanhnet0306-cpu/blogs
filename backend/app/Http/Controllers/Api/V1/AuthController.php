<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->load('roles.permissions');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'data'    => [
                'user'  => $this->userResponse($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.',
            ], 403);
        }

        $user->tokens()->delete();
        $user->load('roles.permissions');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data'    => [
                'user'  => $this->userResponse($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles.permissions');

        return response()->json([
            'success' => true,
            'data'    => $this->userResponse($user),
        ]);
    }

    private function userResponse(User $user): array
    {
        $data = [
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'avatar' => $user->avatar,
            'status' => $user->status,
        ];

        if ($user->relationLoaded('roles')) {
            $data['roles'] = $user->roles->pluck('name');
            $data['permissions'] = $user->roles
                ->flatMap(fn ($role) => $role->permissions->pluck('name'))
                ->unique()
                ->values();
        }

        return $data;
    }
}
