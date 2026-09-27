#!/usr/bin/env python3
"""
wait_jobs.py — wait for Higgsfield jobs by probing the CDN (the filename embeds the job's
creation second, UTC) and download them.

  python3 wait_jobs.py --since-min 5 --out DIR name1=jobid1 name2=jobid2 ...
Downloads each finished job to DIR/<name>.png and prints the URL. Gives up after --timeout s.
"""
import argparse, datetime as dt, subprocess, sys, time, os
from concurrent.futures import ThreadPoolExecutor
BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_3AvdTV4QzMGevLsVk5Y1D7eAOpH'

def head(url):
    r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-I', url], capture_output=True, text=True)
    return r.stdout.strip() == '200'

def probe(job, t0, t1):
    t = t0
    urls = []
    while t <= t1:
        urls.append(f"{BASE}/hf_{t.strftime('%Y%m%d_%H%M%S')}_{job}.png")
        t += dt.timedelta(seconds=1)
    with ThreadPoolExecutor(16) as ex:
        for u, ok in zip(urls, ex.map(head, urls)):
            if ok:
                return u
    return None

ap = argparse.ArgumentParser()
ap.add_argument('--since-min', type=float, default=5)
ap.add_argument('--out', required=True)
ap.add_argument('--timeout', type=int, default=540)
ap.add_argument('jobs', nargs='+')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
now = dt.datetime.now(dt.timezone.utc)
t0 = now - dt.timedelta(minutes=a.since_min)
pending = dict(j.split('=', 1) for j in a.jobs)
found = {}
start = time.time()
while pending and time.time() - start < a.timeout:
    for name, job in list(pending.items()):
        u = probe(job, t0, dt.datetime.now(dt.timezone.utc))
        if u:
            dst = os.path.join(a.out, name + '.png')
            subprocess.run(['curl', '-sf', '--retry', '3', '-o', dst, u])
            print(f'{name} {job} {u}', flush=True)
            found[name] = u
            del pending[name]
    if pending:
        time.sleep(8)
for name, job in pending.items():
    print(f'TIMEOUT {name} {job}', flush=True)
