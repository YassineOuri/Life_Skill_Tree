<?php

namespace App\Enums;

enum Rarity: string
{
    case Common = 'common';
    case Rare = 'rare';
    case Epic = 'epic';
    case Legendary = 'legendary';

    /** XP granted when a skill of this rarity is completed. */
    public function xp(): int
    {
        return match ($this) {
            self::Common => 10,
            self::Rare => 25,
            self::Epic => 50,
            self::Legendary => 100,
        };
    }
}
