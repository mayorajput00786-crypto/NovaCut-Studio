/**
 * AUTOMATED TEST SUITE: SECURE OWNER, ADMIN & CUSTOMER LICENSING SYSTEM
 * Validates all 18 security, device, entitlement, and operational scenarios.
 */

import { db, normalizeEmail, hashKey, generateKeyString } from '../src/server/db/licensingDb';
import {
  verifyGoogleTokenAndAuthorizeOwner,
  activateCustomerLicense,
  validateCustomerLease,
  deactivateDevice,
  generateLicenses,
  signJwt,
  verifyJwt,
  SessionPayload,
} from '../src/server/licensingService';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(num: number, name: string, condition: boolean, details: string) {
  results.push({
    num,
    name,
    passed: !!condition,
    details,
  });
}

export async function runAllLicensingTests(): Promise<{ passedCount: number; totalCount: number; results: TestResult[] }> {
  console.log('\n============================================================');
  console.log('🚀 RUNNING LICENSING & OWNER SECURITY TEST SUITE (18 TESTS)');
  console.log('============================================================\n');

  // Test 1: Owner 1 (Primary) Login with Verified Google Token -> Success, Owner role
  const owner1Res = await verifyGoogleTokenAndAuthorizeOwner('', {
    email: 'josnking01@gmail.com',
    name: 'Primary Owner',
  });
  assert(
    1,
    'Owner 1 Login via Verified Google Credential',
    owner1Res.success === true && owner1Res.user?.isOwner === true && owner1Res.user?.role === 'owner_admin',
    `Result: ${owner1Res.success ? 'Owner session issued' : owner1Res.error}`
  );

  // Test 2: Owner 2 & Owner 3 Login -> Success
  db.addOwner('owner2.secondary@gmail.com', 'Secondary Co-Owner');
  db.addOwner('owner3.finance@gmail.com', 'Executive Co-Owner');

  const owner2Res = await verifyGoogleTokenAndAuthorizeOwner('', {
    email: 'owner2.secondary@gmail.com',
    name: 'Owner Two',
  });
  const owner3Res = await verifyGoogleTokenAndAuthorizeOwner('', {
    email: 'owner3.finance@gmail.com',
    name: 'Owner Three',
  });
  assert(
    2,
    'Secondary Authorized Owners (Owner 2 & 3) Verified',
    owner2Res.success === true && owner3Res.success === true,
    `Owner 2: ${owner2Res.success}, Owner 3: ${owner3Res.success}`
  );

  // Test 3: Unauthorized Gmail Login -> Strictly Denied Owner Privileges
  const unauthorizedRes = await verifyGoogleTokenAndAuthorizeOwner('', {
    email: 'hacker.attacker@gmail.com',
    name: 'Unauthorized User',
  });
  assert(
    3,
    'Unauthorized Google Account Rejection',
    unauthorizedRes.success === false && unauthorizedRes.error?.includes('not in the authorized owner allowlist') === true,
    `Blocked with message: "${unauthorizedRes.error}"`
  );

  // Test 4: Client-Forged Owner Role Flag -> Token Verification Rejects
  const forgedPayload = {
    sub: 'forged_user',
    email: 'forged.user@gmail.com',
    role: 'owner_admin',
    isOwner: true,
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
  const forgedToken = signJwt(forgedPayload, 'wrong_signature_secret');
  const verifiedForged = verifyJwt(forgedToken);
  assert(
    4,
    'Forged Client Token & Signature Tampering Blocked',
    verifiedForged === null,
    'Forged signature with invalid secret was rejected by verifyJwt'
  );

  // Test 5: Customer Activation with Valid Key -> Hardware Bound
  const newLicList = generateLicenses({
    type: 'monthly',
    maxDevices: 2,
    customerName: 'Studio Pro Customer',
    actorEmail: 'josnking01@gmail.com',
  });
  const testKey = newLicList[0].rawKey;
  const testLicId = newLicList[0].record.id;

  const act1 = activateCustomerLicense({
    key: testKey,
    deviceId: 'DEVICE_TEST_SLOT_1',
    deviceName: 'Main Desktop',
    osInfo: 'Windows 11',
  });
  assert(
    5,
    'Customer Activation with Valid Key',
    act1.success === true && act1.license?.currentActivations === 1,
    `Slot 1 activated: ${act1.success}, currentActivations: ${act1.license?.currentActivations}`
  );

  // Test 6: Second Device Activation on Same License (Within 2-Device Limit) -> Success
  const act2 = activateCustomerLicense({
    key: testKey,
    deviceId: 'DEVICE_TEST_SLOT_2',
    deviceName: 'Laptop Pro',
    osInfo: 'Windows 11 Laptop',
  });
  assert(
    6,
    'Second Device Slot Allocation Within Limit',
    act2.success === true && act2.license?.currentActivations === 2,
    `Device 2 allocated successfully (${act2.license?.currentActivations}/2 slots in use)`
  );

  // Test 7: Exceeding Device Limit (3rd Device on 2-Device License) -> Denied
  const act3 = activateCustomerLicense({
    key: testKey,
    deviceId: 'DEVICE_TEST_SLOT_3_OVERFLOW',
    deviceName: 'Third Computer',
    osInfo: 'Windows 10',
  });
  assert(
    7,
    'Device Limit Enforcement Rejects Excess Installations',
    act3.success === false && act3.error?.includes('Device limit reached') === true,
    `Blocked with error: "${act3.error}"`
  );

  // Test 8: Customer Activation with Expired Key -> Denied
  const expiredLic = generateLicenses({
    type: 'custom',
    customDays: -10, // past date
    maxDevices: 1,
    customerName: 'Expired Tester',
    actorEmail: 'josnking01@gmail.com',
  });
  const actExpired = activateCustomerLicense({
    key: expiredLic[0].rawKey,
    deviceId: 'DEVICE_EXPIRED_TEST',
  });
  assert(
    8,
    'Expired License Activation Denied',
    actExpired.success === false && actExpired.error?.includes('expired') === true,
    `Expired rejection message: "${actExpired.error}"`
  );

  // Test 9: Customer Activation with Revoked Key -> Denied
  const revokedLic = generateLicenses({
    type: 'monthly',
    maxDevices: 1,
    customerName: 'Revoked Tester',
    actorEmail: 'josnking01@gmail.com',
  });
  db.updateLicense(revokedLic[0].record.id, { status: 'revoked' });
  const actRevoked = activateCustomerLicense({
    key: revokedLic[0].rawKey,
    deviceId: 'DEVICE_REVOKED_TEST',
  });
  assert(
    9,
    'Revoked License Activation Denied',
    actRevoked.success === false && actRevoked.error?.includes('revoked') === true,
    `Revocation rejection: "${actRevoked.error}"`
  );

  // Test 10: Device Deactivation / Slot Release -> Slot Freed for New Device
  const deactRes = deactivateDevice(testLicId, 'DEVICE_TEST_SLOT_1');
  const actReplacement = activateCustomerLicense({
    key: testKey,
    deviceId: 'DEVICE_REPLACEMENT_SLOT',
    deviceName: 'Replacement Workstation',
    osInfo: 'Windows 11',
  });
  assert(
    10,
    'Customer Slot Deactivation & Hardware Migration',
    deactRes === true && actReplacement.success === true,
    `Slot freed: ${deactRes}, Replacement device activated: ${actReplacement.success}`
  );

  // Test 11: Admin Resets All Device Slots -> Count Cleared to 0
  const resetCount = db.resetAllDevicesForLicense(testLicId);
  const updatedLic = db.findLicenseById(testLicId);
  assert(
    11,
    'Admin Device Slot Reset',
    resetCount > 0 && updatedLic?.currentActivations === 0,
    `Reset ${resetCount} device bindings. Current activations: ${updatedLic?.currentActivations}`
  );

  // Test 12: Admin Revokes Key -> Subsequent Validation Fails
  db.updateLicense(testLicId, { status: 'revoked' });
  const validateRevoked = validateCustomerLease(testLicId, 'DEVICE_REPLACEMENT_SLOT');
  assert(
    12,
    'Live Validation Reflects Admin Revocation Instantly',
    validateRevoked.valid === false && validateRevoked.error?.includes('revoked') === true,
    `Validation error: "${validateRevoked.error}"`
  );

  // Test 13: Offline Lease Cryptographic Verification
  const validLeaseToken = actReplacement.leaseToken;
  const decodedValidLease = verifyJwt(validLeaseToken!);
  assert(
    13,
    'Cryptographic Offline Lease Signature & Expiry Valid',
    decodedValidLease !== null && decodedValidLease.licenseId === testLicId,
    `Lease verified offline, valid until timestamp: ${decodedValidLease?.leaseExpiresAt}`
  );

  // Test 14: Tampered Offline Lease Rejection
  const tamperedLease = validLeaseToken ? validLeaseToken.slice(0, -6) + 'XXXXXX' : '';
  const decodedTampered = verifyJwt(tamperedLease);
  assert(
    14,
    'Tampered Offline Lease Cryptographic Rejection',
    decodedTampered === null,
    'Tampered lease signature was successfully rejected'
  );

  // Test 15: Bulk License Generation -> Correct Unique Keys and Safe Hashes
  const batchRes = generateLicenses({
    type: 'annual',
    maxDevices: 3,
    quantity: 5,
    customerName: 'Enterprise Batch Corp',
    actorEmail: 'josnking01@gmail.com',
  });
  const uniqueKeys = new Set(batchRes.map((b) => b.rawKey));
  const uniqueHashes = new Set(batchRes.map((b) => b.record.keyHash));
  assert(
    15,
    'Bulk License Generator (5 Unique Keys and Hashes)',
    batchRes.length === 5 && uniqueKeys.size === 5 && uniqueHashes.size === 5,
    `Generated ${batchRes.length} unique keys with distinct SHA-256 hashes`
  );

  // Test 16: Email Normalization Policy (Dots and Casing Matching)
  const norm1 = normalizeEmail('Josn.King01+test@gmail.com');
  const norm2 = normalizeEmail('JOSNKING01@GMAIL.COM');
  assert(
    16,
    'Strict Gmail Normalization (Case & Dot Folding)',
    norm1 === 'josnking01@gmail.com' && norm2 === 'josnking01@gmail.com',
    `Normalized "${norm1}" matched expected allowlist key`
  );

  // Test 17: Admin Audit Log Recording
  db.addAuditLog('josnking01@gmail.com', 'MANUAL_TEST_AUDIT_ACTION', { test: true });
  const recentLogs = db.getAuditLogs(10);
  const foundLog = recentLogs.find((l) => l.action === 'MANUAL_TEST_AUDIT_ACTION');
  assert(
    17,
    'Immutable Audit Log Trail Recording',
    !!foundLog && foundLog.actorEmail === 'josnking01@gmail.com',
    `Logged audit record ${foundLog?.id} with timestamp ${foundLog?.timestamp}`
  );

  // Test 18: Owner Allowlist Revocation Revokes Next Check
  db.addOwner('temp.owner@gmail.com', 'Temporary Owner');
  assert(18, 'Dynamic Allowlist Revocation Enforcement', db.isOwner('temp.owner@gmail.com') === true, 'Owner was added');
  db.removeOwner('temp.owner@gmail.com');
  assert(
    18,
    'Removed Owner Denied on Subsequent Verification',
    db.isOwner('temp.owner@gmail.com') === false,
    'Removed owner is immediately rejected by isOwner check'
  );

  // Print Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log('------------------------------------------------------------');
  for (const r of results) {
    console.log(`${r.passed ? '✅ PASS' : '❌ FAIL'} [Test ${r.num}] ${r.name}`);
    console.log(`   └─ ${r.details}`);
  }
  console.log('------------------------------------------------------------');
  console.log(`TOTAL: ${passedCount}/${results.length} TESTS PASSED`);
  console.log('============================================================\n');

  return {
    passedCount,
    totalCount: results.length,
    results,
  };
}

// Auto-run if executed directly via tsx
if (process.argv[1]?.includes('licensingTestRunner')) {
  runAllLicensingTests().then((res) => {
    if (res.passedCount !== res.totalCount) {
      process.exit(1);
    }
  });
}
