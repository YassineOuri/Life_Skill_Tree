<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\SkillNode;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Each skill: key => [title, icon, status, rarity, requires (keys), completed N months ago, steps [title => done N days ago|null]].
     * Prerequisites may point to another category (e.g. English C1 → International cloud role).
     * Prerequisites are always completed before their dependants, so the example tree is valid.
     */
    private array $created = [];

    /** @var array<string, string[]> skill key => prerequisite keys, attached once every skill exists */
    private array $links = [];

    /** Target dates (days from today; negative = overdue) to show deadline badges. */
    private const TARGETS = ['aws-saa' => 10, 'half' => -5, 'invest' => 60, 'intl' => 240];

    public function run(): void
    {
        $categories = [
            ['Career', '#38bdf8', 'briefcase', [
                'cloud' => ['Cloud Engineer', 'cloud', 'completed', 'rare', [], 30],
                'aws-cp' => ['AWS Cloud Practitioner', 'award', 'completed', 'common', ['cloud'], 26],
                'aws-saa' => ['AWS Solutions Architect Associate', 'award', 'in_progress', 'epic', ['aws-cp'], null, [
                    'Finish the video course' => 40,
                    'Hands-on labs (VPC, IAM, S3)' => 21,
                    'Practice exam above 80%' => null,
                    'Book and pass the exam' => null,
                ]],
                'aws-sap' => ['AWS Solutions Architect Professional', 'trophy', 'available', 'legendary', ['aws-saa']],
                'aws-dev' => ['AWS Developer Associate', 'code', 'available', 'rare', ['aws-cp']],
                'linux' => ['Linux', 'terminal', 'completed', 'common', ['cloud'], 24],
                'docker' => ['Docker', 'container', 'completed', 'rare', ['cloud'], 14],
                'k8s' => ['Kubernetes', 'ship-wheel', 'available', 'epic', ['docker', 'linux']],
                'cka' => ['CKA', 'award', 'available', 'epic', ['k8s']],
                'cks' => ['CKS', 'shield', 'available', 'legendary', ['cka']],
                'terraform' => ['Terraform Associate', 'layers', 'available', 'rare', ['cloud']],
                'intl' => ['International cloud role', 'globe', 'available', 'legendary', ['aws-saa', 'english']],
            ]],
            ['Health', '#22c55e', 'heart-pulse', [
                'running' => ['Running', 'footprints', 'completed', 'common', [], 20],
                '10k' => ['Run a 10K', 'flag', 'completed', 'rare', ['running'], 11],
                'half' => ['Half marathon', 'medal', 'in_progress', 'epic', ['10k'], null, [
                    'Run 15 km' => 12,
                    'Run 18 km' => null,
                    'Race day' => null,
                ]],
                'marathon' => ['Marathon', 'trophy', 'available', 'legendary', ['half']],
                'strength' => ['Strength', 'dumbbell', 'in_progress', 'rare', []],
            ]],
            ['Finance', '#eab308', 'piggy-bank', [
                'fund' => ['Emergency fund', 'shield', 'completed', 'rare', [], 9],
                'invest' => ['Start investing', 'trending-up', 'in_progress', 'epic', ['fund']],
            ]],
            ['Languages', '#a855f7', 'languages', [
                'english' => ['English C1', 'book-open', 'completed', 'epic', [], 36],
                'ielts' => ['IELTS 7.5', 'award', 'available', 'rare', ['english']],
                'german' => ['German A1', 'book', 'available', 'common', []],
            ]],
            ['Hobbies', '#f97316', 'gamepad-2', [
                'guitar' => ['Guitar basics', 'music', 'in_progress', 'common', [], null, [
                    'Learn 8 open chords' => 30,
                    'Play a full song' => null,
                ]],
            ]],
        ];

        foreach ($categories as $position => [$name, $color, $icon, $skills]) {
            $category = Category::create(compact('name', 'color', 'icon', 'position'));
            $this->seedSkills($category, $skills);
        }

        foreach ($this->links as $key => $requires) {
            $this->created[$key]->prerequisites()->attach(array_map(fn ($k) => $this->created[$k]->id, $requires));
        }
    }

    private function seedSkills(Category $category, array $skills): void
    {
        $position = 0;

        foreach ($skills as $key => $skill) {
            [$title, $icon, $status, $rarity] = $skill;
            $requires = $skill[4] ?? [];
            $completedMonthsAgo = $skill[5] ?? null;
            $steps = $skill[6] ?? [];

            $node = SkillNode::create([
                'category_id' => $category->id,
                'title' => $title,
                'icon' => $icon,
                'status' => $status,
                'rarity' => $rarity,
                'completed_at' => $completedMonthsAgo !== null ? now()->subMonths($completedMonthsAgo) : null,
                'target_date' => isset(self::TARGETS[$key]) ? today()->addDays(self::TARGETS[$key]) : null,
                'position' => $position++,
            ]);
            $this->links[$key] = $requires;

            $stepPosition = 0;
            foreach ($steps as $stepTitle => $doneDaysAgo) {
                $node->steps()->create([
                    'title' => $stepTitle,
                    'done_at' => $doneDaysAgo !== null ? now()->subDays($doneDaysAgo) : null,
                    'position' => $stepPosition++,
                ]);
            }

            $this->created[$key] = $node;
        }
    }
}
