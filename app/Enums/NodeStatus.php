<?php

namespace App\Enums;

enum NodeStatus: string
{
    case Available = 'available';
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
