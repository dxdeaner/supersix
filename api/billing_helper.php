<?php
// billing_helper.php - Shared billing rules (must match src/utils/timeTracking.js)
//
// Rounding is pooled per BOARD, per local DAY, per RATE: all finished time in that pool is
// added up, then rounded UP once to the next 15 minutes. The rounded minutes are then spread
// across the tasks in the pool in proportion to their time (whole minutes, largest remainder).
// Time added later to an already-invoiced pool bills only what it adds to the pool's rounded total.

/** Seconds → billed minutes (rounded up to 15-minute increments). */
function billedMinutesForSeconds($seconds) {
    return $seconds <= 0 ? 0 : (int)ceil($seconds / 900) * 15;
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
