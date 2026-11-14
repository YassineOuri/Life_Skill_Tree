<?php

namespace App\Http\Requests;

use App\Enums\Rarity;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSkillNodeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'prerequisite_ids' => ['nullable', 'array', $this->prerequisitesRule()],
            'prerequisite_ids.*' => ['integer', 'distinct', 'exists:skill_nodes,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'icon' => ['nullable', 'string', 'max:50'],
            'rarity' => ['nullable', Rule::enum(Rarity::class)],
            'target_date' => ['nullable', 'date'],
            'evidence_url' => ['nullable', 'url', 'max:2048'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Prerequisites may come from any category. A brand-new skill cannot close a cycle,
     * so only updates add a check (see UpdateSkillNodeRequest).
     */
    protected function prerequisitesRule(): Closure
    {
        return fn (string $attribute, mixed $value, Closure $fail) => null;
    }
}
