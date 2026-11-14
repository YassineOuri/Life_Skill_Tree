<?php

return [
    'name' => 'Running ladder',
    'description' => '5K → 10K → half marathon → marathon → ultra.',
    'skills' => [
        ['ref' => '5k', 'title' => 'Run a 5K', 'icon' => 'footprints', 'rarity' => 'common', 'steps' => ['Run 3 times a week for a month', 'Race day']],
        ['ref' => '10k', 'title' => 'Run a 10K', 'icon' => 'flag', 'rarity' => 'rare', 'prerequisites' => ['5k'], 'steps' => ['Long run of 8 km', 'Race day']],
        ['ref' => 'half', 'title' => 'Half marathon', 'icon' => 'medal', 'rarity' => 'epic', 'prerequisites' => ['10k'], 'steps' => ['Long run of 18 km', 'Race day']],
        ['ref' => 'marathon', 'title' => 'Marathon', 'icon' => 'trophy', 'rarity' => 'legendary', 'prerequisites' => ['half'], 'steps' => ['16-week plan', 'Long run of 32 km', 'Race day']],
        ['ref' => 'ultra', 'title' => 'Ultra trail', 'icon' => 'mountain', 'rarity' => 'legendary', 'prerequisites' => ['marathon'], 'steps' => ['Back-to-back long runs', 'Race day']],
    ],
];
