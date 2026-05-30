export default function statusColor(status) {
  const mapping = {
    // Fuel Filling statuses
    pending:               'bg-amber-50 text-amber-700 border-amber-200',
    completed:             'bg-emerald-50 text-emerald-700 border-emerald-200',
    'hod-approval':        'bg-amber-50 text-amber-700 border-amber-200',
    'accounts payment':    'bg-purple-50 text-purple-700 border-purple-200',
    'advance payment':     'bg-sky-50 text-sky-700 border-sky-200',
    'driver submission':   'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return mapping[String(status).toLowerCase().trim()] || 'bg-slate-100 text-slate-600 border-slate-200';
}
