<?php

namespace App\Http\Requests;

use App\Enums\NodeStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNodeStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(NodeStatus::class)],
        ];
    }
}
