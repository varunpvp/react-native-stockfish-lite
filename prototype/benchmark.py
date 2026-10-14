#!/usr/bin/env python3
"""Benchmark the wrapper's native UCI interface locally or on a USB Android device."""
import argparse
import json
from pathlib import Path
import queue
import re
import statistics
import subprocess
import threading
import time

parser = argparse.ArgumentParser()
parser.add_argument("--adb", action="store_true")
parser.add_argument("--jni", action="store_true", help="Use the Android shared library through JNI")
parser.add_argument("--repeat", type=int, default=5)
parser.add_argument("--movetime", type=int)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent
command = (["adb", "shell", "/data/local/tmp/puzzlemine-stockfish-lite"] if args.adb
           else [str(root / "build/mac/stockfish-lite-smoke")])
if args.jni:
    command = ["adb", "shell", "CLASSPATH=/data/local/tmp/puzzlemine-stockfish-lite.jar",
               "app_process", "/system/bin", "com.loloof64.reactnativestockfish.ReactNativeStockfishModule"]
process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT, text=True, bufsize=1)
lines = queue.Queue()
threading.Thread(target=lambda: [lines.put(line.strip()) for line in process.stdout],
                 daemon=True).start()

def send(command):
    process.stdin.write(command + "\n")
    process.stdin.flush()

def until(prefix):
    received = []
    while True:
        line = lines.get(timeout=10)
        received.append(line)
        if line.startswith(prefix):
            return received

results = []
try:
    send("uci")
    until("uciok")
    send("setoption name Threads value 1")
    send("setoption name Hash value 16")
    send("isready")
    until("readyok")
    positions = json.loads((root / "positions.json").read_text())
    for position in positions:
        for attempt in range(args.repeat):
            send("ucinewgame")
            send("isready")
            until("readyok")
            send("position fen " + position["fen"])
            started = time.monotonic()
            send("go depth 12" + (f" movetime {args.movetime}" if args.movetime else ""))
            output = until("bestmove ")
            elapsed = (time.monotonic() - started) * 1000
            info = next(line for line in reversed(output)
                        if re.search(r"score (cp|mate) ", line)
                        and "lowerbound" not in line and "upperbound" not in line)
            score = re.search(r"score (cp|mate) (-?\d+)", info)
            value = int(score[2]) * (1 if position["fen"].split()[1] == "w" else -1)
            results.append({"name": position["name"], "elapsedMs": round(elapsed, 2),
                            "depth": int(re.search(r"\bdepth (\d+)", info)[1]),
                            "whiteScore": {score[1]: value}, "info": info,
                            "bestmove": output[-1].split()[1]})
    send("quit")
    process.wait(timeout=10)
    if process.returncode != 0:
        raise RuntimeError(f"Engine exited with status {process.returncode}")
finally:
    if process.poll() is None:
        process.kill()
        process.wait()

report = {"platform": "android-jni" if args.jni else "android" if args.adb else "mac", "depthLimit": 12,
          "movetimeMs": args.movetime, "threads": 1, "hashMb": 16,
          "repeat": args.repeat, "results": results}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(report, indent=2) + "\n")
for position in positions:
    rows = [row for row in results if row["name"] == position["name"]]
    print(position["name"], "medianMs=", round(statistics.median(r["elapsedMs"] for r in rows), 2),
          "maxMs=", max(r["elapsedMs"] for r in rows), "depths=", sorted({r["depth"] for r in rows}),
          "scores=", [r["whiteScore"] for r in rows], "moves=", sorted({r["bestmove"] for r in rows}))
