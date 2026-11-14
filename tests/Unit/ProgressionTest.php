<?php

namespace Tests\Unit;

use App\Enums\Rarity;
use App\Support\Progression;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ProgressionTest extends TestCase
{
    public static function levels(): array
    {
        return [
            'no xp' => [0, 1, 0, 50],
            'just below level 2' => [49, 1, 0, 50],
            'level 2' => [50, 2, 50, 150],
            'mid level 2' => [120, 2, 50, 150],
            'level 3' => [150, 3, 150, 300],
            'level 4' => [300, 4, 300, 500],
        ];
    }

    #[DataProvider('levels')]
    public function test_level_for_xp(int $xp, int $level, int $floor, int $next): void
    {
        $this->assertSame(
            ['level' => $level, 'xp' => $xp, 'floor' => $floor, 'next' => $next],
            Progression::forXp($xp),
        );
    }

    public function test_rarity_xp(): void
    {
        $this->assertSame(10, Rarity::Common->xp());
        $this->assertSame(25, Rarity::Rare->xp());
        $this->assertSame(50, Rarity::Epic->xp());
        $this->assertSame(100, Rarity::Legendary->xp());
    }
}
