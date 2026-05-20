<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'avatar', 'phone', 'status',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // User <-> Role (nhiều-nhiều)
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    // User có nhiều bài viết
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    // User có nhiều comment
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // User có nhiều file media
    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    // Helper: kiểm tra user có role không
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    // Helper: kiểm tra user có permission không (qua role)
    public function hasPermission(string $permissionName): bool
    {
        return $this->roles()
            ->whereHas('permissions', fn ($q) => $q->where('name', $permissionName))
            ->exists();
    }
}
