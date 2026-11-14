<?php

namespace App\Http\Controllers;

use App\Library\TemplateLibrary;
use App\Library\TreeExporter;
use App\Models\Category;
use App\Models\EvidenceFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Library\TreeImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    /** Download the whole tree as a JSON backup. */
    public function export(TreeExporter $exporter): JsonResponse
    {
        $filename = 'life-skill-tree-'.now()->format('Y-m-d').'.json';

        return response()->json(
            $exporter->export(),
            200,
            ['Content-Disposition' => "attachment; filename=\"{$filename}\""],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );
    }

    /** Import a backup file as new categories. */
    public function import(Request $request, TreeImporter $importer): RedirectResponse
    {
        $request->validate(['file' => ['required', 'file', 'max:2048']]);

        $importer->importBackup($request->file('file')->get());

        return back();
    }

    /**
     * Delete every category, skill, step and evidence file. Requires typing "DELETE".
     * Deleting through Eloquent removes each file from disk; the evidence folder is then
     * cleared to catch any orphan left behind.
     */
    public function purge(Request $request): RedirectResponse
    {
        $request->validate(['confirm' => ['required', 'in:DELETE']], [
            'confirm.*' => 'Type DELETE (in capitals) to confirm.',
        ]);

        DB::transaction(fn () => Category::all()->each->delete());
        Storage::disk(EvidenceFile::DISK)->deleteDirectory('evidence');

        return redirect('/');
    }

    /** Add a built-in learning path to an existing category or to a new one (exactly one). */
    public function applyTemplate(Request $request, string $key, TemplateLibrary $templates, TreeImporter $importer): RedirectResponse
    {
        $template = $templates->find($key) ?? abort(404);

        $data = $request->validate([
            'category_id' => ['nullable', 'required_without:new_category', 'prohibits:new_category', 'integer', 'exists:categories,id'],
            'new_category' => ['nullable', 'required_without:category_id', 'array'],
            'new_category.name' => ['required_with:new_category', 'string', 'max:100'],
            'new_category.color' => ['required_with:new_category', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'new_category.icon' => ['nullable', 'string', 'max:50'],
        ]);

        $category = isset($data['category_id'])
            ? Category::findOrFail($data['category_id'])
            : Category::create($data['new_category'] + ['position' => (Category::max('position') ?? -1) + 1]);

        $importer->applyTemplate($template, $category);

        return back();
    }
}
