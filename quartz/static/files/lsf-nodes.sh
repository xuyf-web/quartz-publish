#!/usr/bin/env bash
set -euo pipefail

# 改成自己的 CPU 节点名前缀，也可以在运行时传入：
# lsf-nodes cpu-
prefix="${1:-cpu-}"

# 从运行作业中统计每个节点已占用的槽位和作业数
jobs() {
  bjobs -w -u all | awk '
    NR > 1 && $3 == "RUN" {
      host = $6
      slots = 1
      if (host ~ /\*/) {
        split(host, a, "*")
        slots = a[1]
        host = a[2]
      }
      used[host] += slots
      count[host]++
    }
    END {
      for (host in used) print host, used[host], count[host]
    }
  '
}

hosts() {
  lshosts -w | awk -v p="$prefix" '
    NR > 1 && index($1, p) == 1 { print $1, $5, $6 }
  '
}

status() {
  bhosts -w | awk -v p="$prefix" '
    NR > 1 && index($1, p) == 1 { print $1, $2 }
  '
}

load() {
  lsload | awk -v p="$prefix" '
    NR > 1 && index($1, p) == 1 { print $1, $2, $6, $11 }
  '
}

# 合并作业、静态资源、调度状态和实时负载
awk '
  function gib(value, number, unit) {
    number = value + 0
    unit = value
    sub(/^[0-9.]+/, "", unit)
    if (unit == "T") return number * 1024
    if (unit == "G") return number
    if (unit == "M") return number / 1024
    if (unit == "K") return number / 1024 / 1024
    return number
  }
  FILENAME == ARGV[1] { used[$1] = $2; jobs[$1] = $3; next }
  FILENAME == ARGV[2] { ncpu[$1] = $2; total_mem[$1] = $3; next }
  FILENAME == ARGV[3] { host_status[$1] = $2; next }
  FILENAME == ARGV[4] {
    host = $1
    free = ncpu[host] - (used[host] + 0)
    total = gib(total_mem[host])
    avail = gib($4)
    mem = total > 0 ? sprintf("%.0f%%", (total - avail) / total * 100) : "NA"
    state = host_status[host] != "" ? host_status[host] : $2
    printf "%s %s %d %d %d %s %s\n",
      host, state, ncpu[host], free, jobs[host] + 0, $3, mem
  }
' <(jobs) <(hosts) <(status) <(load) |
  sort -V |
  awk '
    function load_color(value, n) {
      if (value == "NA") return dim
      n = value + 0
      if (n >= 90) return red
      if (n >= 60) return yellow
      return green
    }
    BEGIN {
      reset = "\033[0m"; dim = "\033[1;30m"; red = "\033[1;31m"
      green = "\033[1;32m"; yellow = "\033[1;33m"
      cyan = "\033[1;36m"; white = "\033[1;37m"
    }
    {
      state_color = $2 == "ok" ? green :
        ($2 ~ /unavail|unreach|down/ ? red : yellow)
      free_color = $4 <= 0 ? red : green
      printf "%s%-8s%s %s%-12s%s ncpu=%s%3d%s free=%s%3d%s jobs=%s%2d%s ut=%s%4s%s mem=%s%4s%s\n",
        cyan, $1, reset, state_color, $2, reset,
        white, $3, reset, free_color, $4, reset,
        yellow, $5, reset, load_color($6), $6, reset,
        load_color($7), $7, reset
    }
  '
