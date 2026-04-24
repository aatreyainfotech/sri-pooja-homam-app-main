/**
 * Real Agora SDK loader — used on iOS / Android.
 * On web, Metro will pick agoraSdk.web.ts instead (empty stub).
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
let sdk: any = null;
try {
  sdk = require('react-native-agora');
} catch {
  sdk = null;
}
export default sdk;
