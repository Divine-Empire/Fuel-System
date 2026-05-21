export default function statusColor(status) {
  const mapping = {
    // Fuel Filling statuses
    pending:          'bg-amber-50 text-amber-700 border-amber-200',
    completed:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return mapping[String(status).toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';
}
