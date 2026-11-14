<?php

namespace App\Support;

use App\Enums\NodeStatus;

/**
 * XP → level curve. Reaching level L needs 25·L·(L−1) XP in total,
 * so each level costs 50 XP more than the previous one: L2 = 50, L3 = 150, L4 = 300…
 */
class Progression
{
    public static function threshold(int $level): int
    {
        return 25 * $level * ($level - 1);
    }

    /**
     * XP earned from the completed skills among $nodes.
     *
     * @param  iterable<\App\Models\SkillNode>  $nodes
     */
    public static function earnedXp(iterable $nodes): int
    {
        $xp = 0;
        foreach ($nodes as $node) {
            if ($node->status === NodeStatus::Completed) {
                $xp += $node->xp();
            }
        }

        return $xp;
    }

    /**
     * @return array{level: int, xp: int, floor: int, next: int}
     */
    public static function forXp(int $xp): array
    {
        $level = 1;
        while (self::threshold($level + 1) <= $xp) {
            $level++;
        }

        return [
            'level' => $level,
            'xp' => $xp,
            'floor' => self::threshold($level),
            'next' => self::threshold($level + 1),
        ];
    }
}
