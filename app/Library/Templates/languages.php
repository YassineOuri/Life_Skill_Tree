<?php

return [
    'name' => 'Language ladder (CEFR)',
    'description' => 'A1 → C2 for any language.',
    'skills' => [
        ['ref' => 'a1', 'title' => 'A1', 'icon' => 'book', 'rarity' => 'common', 'steps' => ['Learn 500 words', 'Introduce yourself']],
        ['ref' => 'a2', 'title' => 'A2', 'icon' => 'book', 'rarity' => 'common', 'prerequisites' => ['a1'], 'steps' => ['Learn 1,000 words', 'Order food and ask for directions']],
        ['ref' => 'b1', 'title' => 'B1', 'icon' => 'book-open', 'rarity' => 'rare', 'prerequisites' => ['a2'], 'steps' => ['Read a short novel', 'Hold a 15-minute conversation']],
        ['ref' => 'b2', 'title' => 'B2', 'icon' => 'book-open', 'rarity' => 'rare', 'prerequisites' => ['b1'], 'steps' => ['Watch a film without subtitles', 'Write a one-page essay']],
        ['ref' => 'c1', 'title' => 'C1', 'icon' => 'graduation-cap', 'rarity' => 'epic', 'prerequisites' => ['b2'], 'steps' => ['Give a presentation', 'Pass an official C1 exam']],
        ['ref' => 'c2', 'title' => 'C2', 'icon' => 'languages', 'rarity' => 'legendary', 'prerequisites' => ['c1'], 'steps' => ['Pass an official C2 exam']],
    ],
];
