<?php

$exam = ['Read the official exam guide', 'Hands-on labs', 'Practice exam above 80%', 'Book and pass the exam'];

return [
    'name' => 'AWS certifications',
    'description' => 'Cloud Practitioner → Associate tier → Professional.',
    'skills' => [
        ['ref' => 'ccp', 'title' => 'AWS Cloud Practitioner', 'icon' => 'cloud', 'rarity' => 'common', 'steps' => $exam],
        ['ref' => 'saa', 'title' => 'AWS Solutions Architect Associate', 'icon' => 'award', 'rarity' => 'epic', 'prerequisites' => ['ccp'], 'steps' => $exam],
        ['ref' => 'dva', 'title' => 'AWS Developer Associate', 'icon' => 'code', 'rarity' => 'rare', 'prerequisites' => ['ccp'], 'steps' => $exam],
        ['ref' => 'soa', 'title' => 'AWS SysOps Administrator Associate', 'icon' => 'server', 'rarity' => 'rare', 'prerequisites' => ['ccp'], 'steps' => $exam],
        ['ref' => 'sap', 'title' => 'AWS Solutions Architect Professional', 'icon' => 'trophy', 'rarity' => 'legendary', 'prerequisites' => ['saa'], 'steps' => $exam],
        ['ref' => 'dop', 'title' => 'AWS DevOps Engineer Professional', 'icon' => 'trophy', 'rarity' => 'legendary', 'prerequisites' => ['dva', 'soa'], 'steps' => $exam],
    ],
];
