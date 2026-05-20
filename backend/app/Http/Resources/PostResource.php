<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TagResource;

class PostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'slug'         => $this->slug,
            'excerpt'      => $this->excerpt,
            'content'      => $this->content,
            'thumbnail'    => $this->thumbnail,
            'status'       => $this->status,
            'is_featured'  => $this->is_featured,
            'published_at' => $this->published_at,
            'view_count'   => $this->view_count,
            'seo'          => [
                'title'       => $this->seo_title,
                'description' => $this->seo_description,
                'keywords'    => $this->seo_keywords,
            ],
            'author'       => new UserResource($this->whenLoaded('user')),
            'category'     => new CategoryResource($this->whenLoaded('category')),
            'tags'         => TagResource::collection($this->whenLoaded('tags')),
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}
