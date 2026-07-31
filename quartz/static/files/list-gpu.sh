#!/usr/bin/env bash
set -uo pipefail

# 改成自己的 GPU 节点和共享脚本路径
GPU_NODE="${GPU_NODE:-gpu-node}"
SELF="${SELF:-/shared/tools/list-gpu}"

# 登录节点没有 nvidia-smi 时，自动转到 GPU 节点执行
if ! command -v nvidia-smi >/dev/null 2>&1; then
  exec ssh -q "$GPU_NODE" "$SELF"
fi

format_cmd() {
  local raw="$1" first rest max=110 head tail

  case "$raw" in
    *multiprocessing.spawn*|*--multiprocessing-fork*)
      cmd="[dataloader worker]"; cmd_color="\033[1;30m"; return ;;
    *ipykernel_launcher*)
      cmd="[jupyter kernel]"; cmd_color="\033[1;30m"; return ;;
  esac

  first=${raw%% *}
  rest=${raw#* }
  [ "$rest" = "$raw" ] && rest=""
  cmd="$(basename "$first") $rest"
  cmd="${cmd% }"
  cmd_color="\033[1;32m"

  if [ ${#cmd} -gt $max ]; then
    head=$(( (max - 3) / 2 ))
    tail=$(( max - 3 - head ))
    cmd="${cmd:0:head}...${cmd: -tail}"
  fi
}

# GPU 利用率、显存和温度
nvidia-smi \
  --query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu \
  --format=csv,noheader |
  awk -F", " '
    BEGIN {
      reset = "\033[0m"; cyan = "\033[1;36m"; green = "\033[1;32m"
      magenta = "\033[1;35m"; yellow = "\033[1;33m"
    }
    {
      mem_pct = int($3 / $4 * 100)
      printf "%sGPU %s%s | Util: %s%-5s%s | Mem: %s%3d%%%s (%9s / %9s) | Temp: %s%s°C%s\n",
        cyan, $1, reset, green, $2, reset,
        magenta, mem_pct, reset, $3, $4,
        yellow, $5, reset
    }
  '

printf '\n\033[1;37m--- Running Processes ---\033[0m\n'
printf '\033[1;30m%-3s | %-8s | %-8s | %-10s | %-9s | %s\033[0m\n' \
  "GPU" "PID" "USER" "MEM" "TIME" "COMMAND"

# 建立 GPU UUID 到序号的映射
declare -A gpu_index
while read -r uuid index; do
  gpu_index[$uuid]=$index
done < <(
  nvidia-smi --query-gpu=index,uuid --format=csv,noheader |
    awk -F", " '{ print $2, $1 }'
)

# 补充进程用户、运行时间和完整命令
while IFS=$'\t' read -r pid mem uuid; do
  [ -z "$pid" ] && continue
  index=${gpu_index[$uuid]:-?}
  info=$(ps -p "$pid" -o user=,etime=,args= 2>/dev/null)

  if [ -n "$info" ]; then
    read -r user elapsed raw_cmd <<< "$info"
    format_cmd "$raw_cmd"
  else
    user="?"; elapsed="?"; cmd="(process exited)"
    cmd_color="\033[1;30m"
  fi

  printf "\033[1;36m%-3s\033[0m | \033[1;31m%-8s\033[0m | \033[1;34m%-8s\033[0m | \033[1;35m%-10s\033[0m | \033[1;33m%-9s\033[0m | ${cmd_color}%s\033[0m\n" \
    "$index" "$pid" "$user" "$mem" "$elapsed" "$cmd"
done < <(
  nvidia-smi \
    --query-compute-apps=pid,used_memory,gpu_uuid \
    --format=csv,noheader |
    awk -F", " -v OFS="\t" '{ print $1, $2, $3 }'
)
