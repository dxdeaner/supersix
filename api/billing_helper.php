<?php
// billing_helper.php - Shared billing rules (must match src/utils/timeTracking.js)
//
// Rounding is pooled per BOARD, per local DAY, per RATE: all finished time in that pool is
// added up, trimmed to whole minutes, then rounded UP once to the next 15 minutes (with a
// 3-minute grace past each block). The rounded minutes are then spread
// across the tasks in the pool in proportion to their time (whole minutes, largest remainder).
// Time added later to an already-invoiced pool bills only what it adds to the pool's rounded total.

const BILLING_GRACE_MIN = 3; // minutes past a block boundary that don't bill the next block

/**
 * Seconds → billed minutes. Seconds past the last whole minute are ignored, then whole
 * minutes round up to the next 15-minute block - unless the time is within the grace period
 * past a block boundary (1h 18m bills as 1h 15m; 1h 19m bills as 1h 30m). Any time at all
 * bills at least one block.
 */
function billedMinutesForSeconds($seconds) {
    $wholeMinutes = intdiv(max(0, (int)$seconds), 60);
    if ($wholeMinutes <= 0) return 0;
    $blocks = intdiv($wholeMinutes, 15);
    $over = $wholeMinutes % 15;
    if ($blocks === 0 || $over === 0) return max($blocks, 1) * 15;
    return ($over <= BILLING_GRACE_MIN ? $blocks : $blocks + 1) * 15;
}

/**
 * Split $total whole minutes across $weights (ints) proportionally, largest remainder first.
 * Ties go to the larger weight, then the lower index. Callers sort by task id first so the
 * client and server break ties identically.
 */
function allocateMinutes($total, array $weights) {
    $weights = array_values($weights);
    $out = array_fill(0, count($weights), 0);
    $sum = array_sum($weights);
    if ($total <= 0 || $sum <= 0) {
        return $out;
    }

    $cands = [];
    $given = 0;
    foreach ($weights as $i => $w) {
        $num = $total * $w;
        $out[$i] = intdiv($num, $sum);
        $given += $out[$i];
        if ($w > 0) {
            $cands[] = ['i' => $i, 'r' => $num % $sum, 'w' => $w];
        }
    }

    usort($cands, fn($a, $b) => ($b['r'] <=> $a['r']) ?: ($b['w'] <=> $a['w']) ?: ($a['i'] <=> $b['i']));
    $left = $total - $given;
    for ($k = 0; $left > 0 && $cands; $k++, $left--) {
        $out[$cands[$k % count($cands)]['i']]++;
    }
    return $out;
}

/** Pool key for a rate: invoiced entries keep the rate saved on their invoice. */
function billingRateKey($taskRate, $boardRate, $invoicedRate, $isInvoiced) {
    $base = $taskRate !== null ? (float)$taskRate : ($boardRate !== null ? (float)$boardRate : null);
    $rate = ($isInvoiced && $invoicedRate !== null) ? (float)$invoicedRate : $base;
    return $rate === null ? 'x' : number_format($rate, 2, '.', '');
}
