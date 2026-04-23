'use client';

import { useEffect, useState } from 'react';

const OPT_IN_KEY = 'clutch-notifications-enabled';

type State = 'unsupported' | 'denied' | 'default' | 'granted-off' | 'granted-on';

export default function NotificationsToggle() {
  const [state, setState] = useState<State>('default');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setState('unsupported');
      return;
    }
    const opted = window.localStorage.getItem(OPT_IN_KEY) === '1';
    if (Notification.permission === 'denied') setState('denied');
    else if (Notification.permission === 'granted' && opted) setState('granted-on');
    else if (Notification.permission === 'granted') setState('granted-off');
    else setState('default');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function enable() {
    if (state === 'unsupported' || state === 'denied') return;
    let perm = Notification.permission;
    if (perm !== 'granted') perm = await Notification.requestPermission();
    if (perm === 'granted') {
      window.localStorage.setItem(OPT_IN_KEY, '1');
      setState('granted-on');
      try {
        new Notification('Clutch Index notifications on', {
          body: 'You\'ll get a ping when a starred team is in a swing moment.',
          icon: '/favicon.ico',
        });
      } catch {}
    } else if (perm === 'denied') {
      setState('denied');
    }
  }

  function disable() {
    window.localStorage.setItem(OPT_IN_KEY, '0');
    setState('granted-off');
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Browser notifications
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get pinged when one of your starred teams is in a swing moment — even when
            this tab is backgrounded. Fully client-side, no server subscriptions.
          </p>
        </div>
        {state === 'granted-on' ? (
          <button
            onClick={disable}
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Enabled · tap to turn off
          </button>
        ) : state === 'granted-off' ? (
          <button
            onClick={enable}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Re-enable
          </button>
        ) : state === 'denied' ? (
          <span className="shrink-0 text-xs text-rose-600">
            Blocked at the browser level — reset site permissions to re-enable.
          </span>
        ) : state === 'unsupported' ? (
          <span className="shrink-0 text-xs text-slate-500">Not supported by this browser.</span>
        ) : (
          <button
            onClick={enable}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Enable notifications
          </button>
        )}
      </div>
    </div>
  );
}
