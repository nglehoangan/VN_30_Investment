#!/usr/bin/env python3
"""Planning-only CLI: no network, live Skill dispatch, scoring, deployment or publication."""
import argparse
import json
import sys
from control import ROOT, SKILLS, PURPOSES, Universe, Rollout, prepare, read


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    sub = parser.add_subparsers(dest='operation', required=True)
    for name in ('prepare', 'inventory', 'plan', 'status'):
        command = sub.add_parser(name, allow_abbrev=False)
        command.add_argument('--universe-version', required=True)
        if name in ('prepare', 'inventory'):
            command.add_argument('--reference-date', required=True)
        if name == 'prepare':
            command.add_argument('--ticker', action='append', required=True)
            command.add_argument('--skill', choices=SKILLS, required=True)
            command.add_argument('--purpose', choices=PURPOSES, required=True)
            command.add_argument('--exchange')
            command.add_argument('--sector')
            command.add_argument('--parameters-json')
        if name in ('plan', 'status'):
            command.add_argument('--store', required=True)
        if name == 'plan': command.add_argument('--requests-json', required=True)
        if name == 'status': command.add_argument('--queue-id', required=True)
    args = parser.parse_args(argv)
    if args.operation == 'prepare' and len(args.ticker) != 1:
        parser.error('EXACTLY_ONE_TICKER_REQUIRED; repeated --ticker is rejected')
    universe = Universe(args.universe_version, ROOT)
    if args.operation == 'prepare':
        request = {'ticker': args.ticker[0], 'skill': args.skill, 'referenceDate': args.reference_date,
                   'purpose': args.purpose, 'parameters': read(args.parameters_json) if args.parameters_json else {}}
        if args.exchange: request['exchange'] = args.exchange
        if args.sector: request['sector'] = args.sector
        output = prepare(request, universe)
    elif args.operation == 'inventory':
        output = universe.inventory(args.reference_date)
    else:
        rollout = Rollout(args.store, universe)
        output = ({'queueId': rollout.plan(read(args.requests_json)), 'concurrency': 1, 'workersInvoked': 0}
                  if args.operation == 'plan' else rollout.status(args.queue_id))
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try: main()
    except (ValueError, KeyError, OSError) as error:
        print(json.dumps({'status': 'BLOCKED', 'reason': str(error), 'workersInvoked': 0}), file=sys.stderr)
        sys.exit(1)
