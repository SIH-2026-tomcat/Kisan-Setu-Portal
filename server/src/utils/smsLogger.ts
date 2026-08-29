/**
 * Simulated SMS Service
 * In production, this would integrate with CDAC SMS Gateway or an approved Telecom Provider.
 * In demo mode, it logs formatted notifications and persists notification records for the farmer.
 */
export function logSimulatedSMS(mobileNumber: string, message: string): void {
  const timestamp = new Date().toISOString();
  console.log('====================================================');
  console.log(`📱 [SIMULATED SMS] To: +91-${mobileNumber} at ${timestamp}`);
  console.log(`📩 Message: "${message}"`);
  console.log('====================================================');
}
