#!/bin/bash
# Rekaman → mono 48 kHz; potong hening; highpass 80 Hz; redam bising ringan; kompresi ringan; loudnorm dua tahap -17.5 LUFS, true peak -1.5 dB
cd /mnt/c/Users/MuhammadFauzanRamadh/Videos/HalalPilot-edit
declare -A MAP=( [00]=00-pembuka [01]=01-c0 [02]=01-c1 [03]=01-c2 [04]=01-c3 [99]=99-penutup )
PRE="highpass=f=80,afftdn=nf=-32:nr=10,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.25,areverse,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=90:makeup=2"
for n in 00 01 02 03 04 99; do
  out=rekam/${MAP[$n]}.mp3
  J=$(ffmpeg -v info -i rekam/$n.m4a -ac 1 -af "$PRE,loudnorm=I=-17.5:TP=-1.5:LRA=9:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  MI=$(echo "$J" | grep input_i | sed 's/.*: "\(.*\)".*/\1/'); MTP=$(echo "$J" | grep input_tp | sed 's/.*: "\(.*\)".*/\1/'); MLRA=$(echo "$J" | grep input_lra | sed 's/.*: "\(.*\)".*/\1/'); MTH=$(echo "$J" | grep input_thresh | sed 's/.*: "\(.*\)".*/\1/'); OFF=$(echo "$J" | grep target_offset | sed 's/.*: "\(.*\)".*/\1/')
  ffmpeg -v error -y -i rekam/$n.m4a -ac 1 -af "$PRE,loudnorm=I=-17.5:TP=-1.5:LRA=9:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$OFF:linear=true,alimiter=limit=0.7:attack=3:release=60:level=false,aresample=48000" -c:a libmp3lame -b:a 192k $out
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $out)
  l=$(ffmpeg -v info -i $out -af ebur128=peak=true -f null - 2>&1 | grep -E "^ +I:|Peak:" | tail -2 | tr -s ' ' | tr '\n' ' ')
  echo "${MAP[$n]} dur=$d $l"
done
