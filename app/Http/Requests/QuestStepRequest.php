<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuestStepRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
        ];
    }
}
