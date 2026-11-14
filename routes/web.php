<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChronicleController;
use App\Http\Controllers\EvidenceFileController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\QuestStepController;
use App\Http\Controllers\SkillNodeController;
use App\Http\Controllers\SkillTreeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [SkillTreeController::class, 'index'])->name('tree.index');

Route::resource('categories', CategoryController::class)->only(['store', 'update', 'destroy']);

Route::resource('nodes', SkillNodeController::class)->only(['store', 'update', 'destroy']);
Route::patch('nodes/{node}/status', [SkillNodeController::class, 'updateStatus'])->name('nodes.status');

Route::post('nodes/{node}/steps', [QuestStepController::class, 'store'])->name('steps.store');
Route::put('steps/{step}', [QuestStepController::class, 'update'])->name('steps.update');
Route::patch('steps/{step}/toggle', [QuestStepController::class, 'toggle'])->name('steps.toggle');
Route::delete('steps/{step}', [QuestStepController::class, 'destroy'])->name('steps.destroy');

Route::get('chronicle', [ChronicleController::class, 'index'])->name('chronicle');

Route::post('nodes/{node}/files', [EvidenceFileController::class, 'store'])->name('files.store');
Route::get('files/{file}', [EvidenceFileController::class, 'show'])->name('files.show');
Route::get('files/{file}/download', [EvidenceFileController::class, 'download'])->name('files.download');
Route::delete('files/{file}', [EvidenceFileController::class, 'destroy'])->name('files.destroy');

Route::get('library/export', [LibraryController::class, 'export'])->name('library.export');
Route::post('library/import', [LibraryController::class, 'import'])->name('library.import');
Route::post('library/templates/{key}', [LibraryController::class, 'applyTemplate'])->name('library.templates');
Route::delete('library/purge', [LibraryController::class, 'purge'])->name('library.purge');
