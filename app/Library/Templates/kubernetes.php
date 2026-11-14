<?php

$exam = ['Follow a course', 'Practise in a lab cluster', 'Timed mock exam', 'Book and pass the exam'];

return [
    'name' => 'Kubernetes (CNCF)',
    'description' => 'Linux + containers → KCNA → CKA / CKAD → CKS.',
    'skills' => [
        ['ref' => 'linux', 'title' => 'Linux basics', 'icon' => 'terminal', 'rarity' => 'common', 'steps' => ['Shell and file system', 'Processes and networking']],
        ['ref' => 'containers', 'title' => 'Containers', 'icon' => 'container', 'rarity' => 'common', 'steps' => ['Build an image', 'Run a multi-container app']],
        ['ref' => 'kcna', 'title' => 'KCNA', 'icon' => 'ship-wheel', 'rarity' => 'rare', 'prerequisites' => ['linux', 'containers'], 'steps' => $exam],
        ['ref' => 'cka', 'title' => 'CKA', 'icon' => 'award', 'rarity' => 'epic', 'prerequisites' => ['kcna'], 'steps' => $exam],
        ['ref' => 'ckad', 'title' => 'CKAD', 'icon' => 'code', 'rarity' => 'epic', 'prerequisites' => ['kcna'], 'steps' => $exam],
        ['ref' => 'cks', 'title' => 'CKS', 'icon' => 'shield', 'rarity' => 'legendary', 'prerequisites' => ['cka'], 'steps' => $exam],
    ],
];
