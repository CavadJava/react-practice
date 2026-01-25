#!/bin/bash

# 1. Display current memory statistics
echo "--- Current Memory Usage ---"
vm_stat | perl -ne '/page size of (\d+) bytes/ && ($s=$1); /Pages (free|active|inactive|speculative|stored in copy-on-write operation|occupying purgeable|wired down): \s+(\d+)/ && printf("%-30s %10.2f MB\n", $1, $2*$s/1024/1024);'

# 2. Show specifically what macOS considers "Cached"
CACHED_MEM=$(sysctl -n hw.memsize)
echo "----------------------------"
echo "Total Physical RAM: $(($CACHED_MEM / 1024 / 1024)) MB"

# 3. Ask to clear the cache
read -p "Would you like to clear the inactive memory cache? (y/n): " confirm
if [ "$confirm" = "y" ]; then
    echo "Clearing cache... you may need to enter your password."
    sudo purge
    echo "Memory purged successfully."
else
    echo "Exiting without clearing."
fi

echo "--- Top 5 Processes holding Inactive/Cached Data ---"
# This sorts by non-resident memory hits
top -l 1 -o mem -n 5 | tail -n 6 | awk '{print $1, $2, $8}'
echo "----------------------------------------------------"