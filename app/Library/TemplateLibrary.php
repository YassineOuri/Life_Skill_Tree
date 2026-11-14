<?php

namespace App\Library;

/**
 * Built-in learning paths. Each template file returns
 * ['name', 'description', 'skills' => [[ref, title, icon, rarity, prerequisites?, steps? (titles)]]].
 */
class TemplateLibrary
{
    /** Display order. */
    public const KEYS = ['aws', 'kubernetes', 'languages', 'running'];

    public function find(string $key): ?array
    {
        if (! in_array($key, self::KEYS, true)) {
            return null;
        }

        return require __DIR__."/Templates/{$key}.php";
    }

    /** Summaries for the UI: [{key, name, description, skills}] (skills = titles). */
    public function summaries(): array
    {
        return array_map(function (string $key) {
            $template = $this->find($key);

            return [
                'key' => $key,
                'name' => $template['name'],
                'description' => $template['description'],
                'skills' => array_column($template['skills'], 'title'),
            ];
        }, self::KEYS);
    }
}
