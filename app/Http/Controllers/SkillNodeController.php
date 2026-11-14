<?php

namespace App\Http\Controllers;

use App\Enums\NodeStatus;
use App\Http\Requests\StoreSkillNodeRequest;
use App\Http\Requests\UpdateNodeStatusRequest;
use App\Http\Requests\UpdateSkillNodeRequest;
use App\Models\SkillNode;
use App\Services\NodeStatusService;
use Illuminate\Http\RedirectResponse;

class SkillNodeController extends Controller
{
    public function store(StoreSkillNodeRequest $request): RedirectResponse
    {
        $data = $this->attributes($request->safe()->except('prerequisite_ids'));
        $data['position'] ??= SkillNode::where('category_id', $data['category_id'])->count();

        $node = SkillNode::create($data + ['status' => NodeStatus::Available]);
        $node->prerequisites()->sync($request->validated('prerequisite_ids') ?? []);

        return back();
    }

    public function update(UpdateSkillNodeRequest $request, SkillNode $node): RedirectResponse
    {
        $data = $this->attributes($request->safe()->except(['prerequisite_ids', 'completed_at']));

        // Backdating only makes sense for a completed skill.
        if ($node->status === NodeStatus::Completed && $request->filled('completed_at')) {
            $data['completed_at'] = $request->date('completed_at');
        }

        $node->update($data);
        $node->prerequisites()->sync($request->validated('prerequisite_ids') ?? []);

        return back();
    }

    /** A missing rarity falls back to the column default (common). */
    private function attributes(array $data): array
    {
        if (empty($data['rarity'])) {
            unset($data['rarity']);
        }

        return $data;
    }

    public function updateStatus(UpdateNodeStatusRequest $request, SkillNode $node, NodeStatusService $service): RedirectResponse
    {
        $service->transition($node, NodeStatus::from($request->validated('status')));

        return back();
    }

    public function destroy(SkillNode $node): RedirectResponse
    {
        $node->delete();

        return back();
    }
}
