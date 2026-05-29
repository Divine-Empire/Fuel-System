export const dashboardService = {
  getDashboardData: (rawRequests = [], dateRange = null, currentUser = null) => {

    // Filter requests for USER role
    if (currentUser && currentUser.role === 'USER') {
      rawRequests = rawRequests.filter(
        (req) => req.issuedTo && req.issuedTo.toLowerCase() === currentUser.name.toLowerCase()
      );
    }

    // Extract unique filter dropdown options from rawRequests (so they remain complete and stable)
    const vehicles = Array.from(new Set(rawRequests.map((r) => r.vehicleNo).filter(Boolean))).sort();
    const drivers = Array.from(new Set(rawRequests.map((r) => r.issuedTo).filter(Boolean))).sort();
    const locations = Array.from(
      new Set(
        rawRequests
          .map((r) => {
            if (!r.location) return null;
            if (r.location === 'Others') return r.customLocation || 'Others';
            if (r.location === 'Office' || r.location === 'Employee Travel') return r.location;
            if (/^\d+$/.test(r.location)) return `Location ${r.location}`;
            return r.location;
          })
          .filter(Boolean)
      )
    ).sort();

    let requests = [...rawRequests];

    // Apply global date filters if any
    if (dateRange && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      requests = requests.filter((req) => {
        if (!req.requestDate) return false;
        const date = new Date(req.requestDate);
        return date >= start && date <= end;
      });
    }

    // Totals calculations
    const totalRequests = requests.length;
    let pendingFilling = 0;
    let completedFilling = 0;
    let totalFuelExpense = 0;
    let totalLitresFilled = 0;
    const uniqueVehicles = new Set();

    requests.forEach((req) => {
      if (req.vehicleNo && req.vehicleNo !== 'Personal') {
        uniqueVehicles.add(req.vehicleNo);
      }
      if (req.status === 'pending') {
        pendingFilling++;
      } else if (req.status === 'completed') {
        completedFilling++;
        totalFuelExpense += req.totalAmount || 0;
        if (req.logType !== 'employee' && req.vehicleNo !== 'Personal') {
          totalLitresFilled += req.qty || 0;
        }
      }
    });

    return {
      metrics: {
        totalRequests,
        pendingFilling,
        completedFilling,
        totalFuelExpense,
        totalLitresFilled,
        vehiclesCount: uniqueVehicles.size,
      },
      requests,
      filterOptions: {
        vehicles,
        drivers,
        locations,
      },
    };
  },
};
