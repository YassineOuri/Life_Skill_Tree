<?php

namespace App\Http\Controllers;

use App\Models\EvidenceFile;
use App\Models\SkillNode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EvidenceFileController extends Controller
{
    public function store(Request $request, SkillNode $node): RedirectResponse
    {
        $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['file', 'mimes:pdf,png,jpg,jpeg,webp', 'max:10240'],
        ]);

        foreach ($request->file('files') as $upload) {
            $node->files()->create([
                'original_name' => $upload->getClientOriginalName(),
                'path' => $upload->store("evidence/{$node->id}", EvidenceFile::DISK),
                'mime' => $upload->getMimeType(),
                'size' => $upload->getSize(),
            ]);
        }

        return back();
    }

    public function show(EvidenceFile $file): StreamedResponse
    {
        return $this->disk($file)->response($file->path, $file->original_name, ['Content-Type' => $file->mime], 'inline');
    }

    public function download(EvidenceFile $file): StreamedResponse
    {
        return $this->disk($file)->download($file->path, $file->original_name);
    }

    public function destroy(EvidenceFile $file): RedirectResponse
    {
        $file->delete();

        return back();
    }

    private function disk(EvidenceFile $file)
    {
        $disk = Storage::disk(EvidenceFile::DISK);
        abort_unless($disk->exists($file->path), 404);

        return $disk;
    }
}
