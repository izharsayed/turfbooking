export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function getBookingStatus(
  dbStatus: string,
  dateStr: string,
  timeStr: string
): 'UPCOMING' | 'COMPLETED' | 'CANCELLED' {
  if (dbStatus === 'cancelled' || dbStatus === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (dbStatus === 'completed' || dbStatus === 'COMPLETED') {
    return 'COMPLETED';
  }
  
  try {
    if (!dateStr || dateStr === 'undefined') {
      return 'COMPLETED';
    }

    const now = new Date();
    
    // Parse dateStr (handles both "2026-07-09" and full ISO strings)
    const cleanDateStr = dateStr ? dateStr.split('T')[0] : '';
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return 'COMPLETED';
    }

    const bookingDate = new Date(year, month - 1, day);
    if (isNaN(bookingDate.getTime())) {
      return 'COMPLETED';
    }
    
    // Compare dates first (ignoring hours)
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (bookingDate < todayDate) {
      return 'COMPLETED';
    }
    if (bookingDate > todayDate) {
      return 'UPCOMING';
    }
    
    // Date is today: check end time in timeStr (e.g. "04:00 AM - 05:00 AM" or "15:00 - 16:00")
    const parts = timeStr.split(' - ');
    if (parts.length < 2) return 'UPCOMING';
    
    const endTimeStr = parts[1].trim();
    
    let hours = 0;
    let minutes = 0;
    
    if (endTimeStr.toUpperCase().includes('AM') || endTimeStr.toUpperCase().includes('PM')) {
      const cleanTime = endTimeStr.replace(/(AM|PM)/i, '').trim();
      const [hStr, mStr] = cleanTime.split(':');
      hours = Number(hStr);
      minutes = Number(mStr);
      
      const isPM = endTimeStr.toUpperCase().includes('PM');
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
    } else {
      const [hStr, mStr] = endTimeStr.split(':');
      hours = Number(hStr);
      minutes = Number(mStr);
    }
    
    bookingDate.setHours(hours, minutes, 0, 0);
    
    return now > bookingDate ? 'COMPLETED' : 'UPCOMING';
  } catch (e) {
    return dbStatus === 'active' || dbStatus === 'UPCOMING' ? 'UPCOMING' : 'COMPLETED';
  }
}
