export function generateRequestNo(existingRequests = []) {
  if (!existingRequests || existingRequests.length === 0) {
    return 'REQ-1001';
  }
  
  let maxNum = 1000;
  existingRequests.forEach(req => {
    if (req.requestNo && req.requestNo.startsWith('REQ-')) {
      const numPart = parseInt(req.requestNo.replace('REQ-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  
  return `REQ-${maxNum + 1}`;
}

export function generateSlipNo(existingRequests = []) {
  if (!existingRequests || existingRequests.length === 0) {
    return 'SLIP-1001';
  }
  
  let maxNum = 1000;
  existingRequests.forEach(req => {
    if (req.slipNo && req.slipNo.startsWith('SLIP-')) {
      const numPart = parseInt(req.slipNo.replace('SLIP-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  
  return `SLIP-${maxNum + 1}`;
}
