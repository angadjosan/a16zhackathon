# Hour 6 Integration Test Cases

**Date:** October 10, 2025  
**Project:** TrustDocs - Verifiable AI Document Extraction  
**Hour:** 6 (4:00-5:00)  
**Focus:** Public Verification Interface

---

## Hour 6 Test Cases

### Aditya: Cryptography & Verification - Public Verification Interface

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| AD-6.1 | Public verification endpoint exists | GET `/api/verify/public/[proofId]` returns 200 | ⬜️ |
| AD-6.2 | Endpoint returns proof metadata | Response includes proofId, status, documentType, fieldCount | ⬜️ |
| AD-6.3 | No sensitive data exposure | Response does NOT include field values or document images | ⬜️ |
| AD-6.4 | Confidence scores included | Response includes average, min, max confidence scores | ⬜️ |
| AD-6.5 | Verification history included | Response includes total/successful/failed verification counts | ⬜️ |
| AD-6.6 | CORS headers present | OPTIONS request returns proper CORS headers | ⬜️ |
| AD-6.7 | Cache headers present | Response includes Cache-Control header | ⬜️ |
| AD-6.8 | 404 for invalid proof | Returns 404 with error message for non-existent proofId | ⬜️ |
| AD-6.9 | Shareable URL generation | `generateShareableURL()` creates valid verification URLs | ⬜️ |
| AD-6.10 | URL parsing works | `parseProofIdFromURL()` extracts proofId from URL | ⬜️ |
| AD-6.11 | Embed code generation | `generateEmbedCode()` creates valid iframe HTML | ⬜️ |
| AD-6.12 | Copy to clipboard utility | `copyToClipboard()` successfully copies text | ⬜️ |
| AD-6.13 | Verification badge renders | VerificationBadge component displays with correct status | ⬜️ |
| AD-6.14 | Badge size variations | Badge renders in small, medium, and large sizes | ⬜️ |
| AD-6.15 | Status color coding | Verified=green, Pending=yellow, Failed=red | ⬜️ |
| AD-6.16 | Inline badge variant | InlineVerificationBadge renders compact version | ⬜️ |
| AD-6.17 | Banner variant | VerificationBanner displays full information | ⬜️ |
| AD-6.18 | Verification page loads | `/verify/[proofId]` page renders successfully | ⬜️ |
| AD-6.19 | Page shows verification status | Page displays verification banner with status | ⬜️ |
| AD-6.20 | Document info displayed | Page shows document type, field count, timestamps | ⬜️ |
| AD-6.21 | Confidence scores displayed | Page shows confidence score bars (avg, min, max) | ⬜️ |
| AD-6.22 | Technical details shown | Page displays model, platform, proofId, merkleRoot | ⬜️ |
| AD-6.23 | Verification history shown | Page displays verification statistics | ⬜️ |
| AD-6.24 | Copy link functionality | "Copy Link" button copies shareable URL | ⬜️ |
| AD-6.25 | Embed code generation | "Show Embed Code" reveals and copies iframe code | ⬜️ |
| AD-6.26 | Loading state works | Page shows loading spinner while fetching data | ⬜️ |
| AD-6.27 | Error state works | Page shows error message for invalid proofId | ⬜️ |
| AD-6.28 | Responsive layout | Page adapts to different screen sizes | ⬜️ |
| AD-6.29 | Embed widget loads | `/embed/[proofId]` page renders in iframe | ⬜️ |
| AD-6.30 | Widget shows status | Embed displays verification status with color coding | ⬜️ |
| AD-6.31 | Widget shows info | Embed displays type, fields, confidence, model, date | ⬜️ |
| AD-6.32 | Widget links to full page | "View Full Details" button opens verification page | ⬜️ |
| AD-6.33 | Widget iframe-compatible | Widget renders correctly inside iframe | ⬜️ |
| AD-6.34 | Widget compact design | Widget uses appropriate sizing for embedding | ⬜️ |

---

## Testing Procedure

### 1. Public Verification API Endpoint

**Test the public verification endpoint:**

```bash
# Start the development server
npm run dev

# Test with a valid proof ID (use an actual proofId from your database)
curl http://localhost:3000/api/verify/public/550e8400-e29b-41d4-a716-446655440000 \
  -H "Accept: application/json" \
  -v

# Expected response:
# {
#   "success": true,
#   "data": {
#     "proofId": "550e8400-e29b-41d4-a716-446655440000",
#     "verified": true,
#     "status": "verified",
#     "documentType": "receipt",
#     "fieldCount": 5,
#     "confidenceScore": { "average": 0.95, "min": 0.85, "max": 0.99 },
#     "verificationHistory": { ... }
#   }
# }

# Test CORS preflight
curl -X OPTIONS http://localhost:3000/api/verify/public/test-proof-id \
  -H "Access-Control-Request-Method: GET" \
  -H "Origin: https://example.com" \
  -v

# Expected: Access-Control-Allow-Origin header present

# Test 404 error
curl http://localhost:3000/api/verify/public/invalid-proof-id \
  -H "Accept: application/json" \
  -v

# Expected: 404 status code with error message
```

**Verify no sensitive data is exposed:**

```bash
# Check response does NOT contain:
# - field values (like "total": 123.45)
# - document image URLs
# - OCR text
# - bounding boxes

# Response SHOULD only contain metadata
```

---

### 2. Shareable URL Utilities

**Test URL generation and parsing:**

```bash
# Create a test script
cat > test-shareable-urls.js << 'EOF'
import { 
  generateShareableURL, 
  parseProofIdFromURL,
  generateEmbedCode,
  copyToClipboard 
} from './src/utils/shareableProof.ts';

async function testShareableURLs() {
  const testProofId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Test URL generation
  console.log('Testing URL generation...');
  const shareableUrl = generateShareableURL(testProofId);
  console.log('Full URL:', shareableUrl.fullUrl);
  console.log('Short URL:', shareableUrl.shortUrl);
  console.log('✅ URL generation works');
  
  // Test URL parsing
  console.log('\nTesting URL parsing...');
  const parsedId = parseProofIdFromURL(shareableUrl.fullUrl);
  console.log('Parsed proof ID:', parsedId);
  console.log('✅ URL parsing works:', parsedId === testProofId);
  
  // Test embed code generation
  console.log('\nTesting embed code generation...');
  const embedCode = generateEmbedCode(testProofId, { width: 400, height: 200 });
  console.log('Embed code:', embedCode);
  console.log('✅ Contains iframe tag:', embedCode.includes('<iframe'));
  console.log('✅ Contains proof ID:', embedCode.includes(testProofId));
  
  console.log('\n✅ All shareable URL tests passed!');
}

testShareableURLs().catch(console.error);
EOF

# Run the test
node test-shareable-urls.js
```

---

### 3. Verification Badge Components

**Test badge rendering:**

```bash
# Create a test Next.js page
cat > src/app/test-badges/page.tsx << 'EOF'
'use client';

import { 
  VerificationBadge, 
  InlineVerificationBadge, 
  VerificationBanner 
} from '@/components/VerificationBadge';

export default function TestBadgesPage() {
  const testProofId = '550e8400-e29b-41d4-a716-446655440000';
  
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Verification Badge Tests</h1>
      
      {/* Test verified status */}
      <section>
        <h2 className="text-xl mb-4">Verified Status</h2>
        <div className="space-y-4">
          <VerificationBadge proofId={testProofId} status="verified" size="small" />
          <VerificationBadge proofId={testProofId} status="verified" size="medium" />
          <VerificationBadge proofId={testProofId} status="verified" size="large" />
        </div>
      </section>
      
      {/* Test pending status */}
      <section>
        <h2 className="text-xl mb-4">Pending Status</h2>
        <VerificationBadge proofId={testProofId} status="pending" size="medium" />
      </section>
      
      {/* Test failed status */}
      <section>
        <h2 className="text-xl mb-4">Failed Status</h2>
        <VerificationBadge proofId={testProofId} status="failed" size="medium" />
      </section>
      
      {/* Test inline badge */}
      <section>
        <h2 className="text-xl mb-4">Inline Badge</h2>
        <p>This document is <InlineVerificationBadge proofId={testProofId} status="verified" /> on TrustDocs.</p>
      </section>
      
      {/* Test banner */}
      <section>
        <h2 className="text-xl mb-4">Verification Banner</h2>
        <VerificationBanner 
          proofId={testProofId}
          status="verified"
          documentType="receipt"
          extractionTimestamp="2025-10-10T14:23:01Z"
          model="claude-sonnet-4.5"
        />
      </section>
    </div>
  );
}
EOF

# Visit http://localhost:3000/test-badges
# Verify all badges render with correct colors and sizes
```

---

### 4. Public Verification Page

**Test verification page:**

```bash
# Visit the verification page in browser:
# http://localhost:3000/verify/[your-actual-proof-id]

# Manual checks:
# ✅ Page loads without errors
# ✅ Verification banner displays at top
# ✅ Document information section shows type, fields, dates
# ✅ Confidence score bars animate and show percentages
# ✅ Technical details show model, platform, IDs
# ✅ Verification history shows statistics
# ✅ "Copy Link" button copies URL to clipboard
# ✅ "Show Embed Code" reveals iframe code
# ✅ "Copy Code" button copies embed code
# ✅ Page is responsive (test at 768px, 1024px, 1920px)

# Test loading state:
# - Throttle network in DevTools
# - Refresh page
# - Should see loading spinner

# Test error state:
# http://localhost:3000/verify/invalid-proof-id-12345
# Should see error message
```

---

### 5. Embeddable Widget

**Test embed widget:**

```bash
# Create a test HTML file
cat > test-embed.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>TrustDocs Embed Test</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    iframe { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>TrustDocs Verification Embed Test</h1>
  
  <h2>Default Size (400x200)</h2>
  <iframe 
    src="http://localhost:3000/embed/550e8400-e29b-41d4-a716-446655440000" 
    width="400" 
    height="200" 
    frameborder="0" 
    style="border: 1px solid #e5e7eb; border-radius: 8px;"
  ></iframe>
  
  <h2>Large Size (600x300)</h2>
  <iframe 
    src="http://localhost:3000/embed/550e8400-e29b-41d4-a716-446655440000" 
    width="600" 
    height="300" 
    frameborder="0" 
    style="border: 1px solid #e5e7eb; border-radius: 8px;"
  ></iframe>
  
  <h2>Invalid Proof ID</h2>
  <iframe 
    src="http://localhost:3000/embed/invalid-proof-id" 
    width="400" 
    height="200" 
    frameborder="0" 
    style="border: 1px solid #e5e7eb; border-radius: 8px;"
  ></iframe>
</body>
</html>
EOF

# Open test-embed.html in browser
# Verify:
# ✅ Widgets load in iframes
# ✅ Status colors display correctly
# ✅ Document info shows (type, fields, confidence, etc.)
# ✅ "View Full Details" link opens in new tab
# ✅ Invalid proof shows error state
# ✅ Widget adapts to different sizes
```

---

### 6. Automated Test Suite

**Run the Hour 6 test suite:**

```bash
# Run all Hour 6 tests
npm run test:hour6

# Expected output:
# 🧪 Hour 6 Tests - Aditya (Public Verification Interface)
# 
# 📦 Public Verification Endpoint
#   ✅ Public verification route file exists
#   ✅ GET handler exported
#   ✅ Response includes required fields
#   ... (more tests)
#
# 📊 Test Summary
# Total Tests:  67
# ✅ Passed:    67 (100%)
# ❌ Failed:    0
```

---

### 7. Integration Testing

**Test end-to-end public verification flow:**

```bash
# 1. Upload a document and extract data (Hours 1-5 should be working)
# 2. Get the proofId from the extraction result
# 3. Test the public verification flow:

# Access via API
curl http://localhost:3000/api/verify/public/[proofId]

# Access via web page
# Open: http://localhost:3000/verify/[proofId]

# Generate shareable URL
# Copy the URL from the verification page

# Share the URL
# Open URL in incognito/private window (no auth)
# Should see full verification details

# Test embed
# Copy embed code from verification page
# Paste into test HTML file
# Open HTML file
# Should see widget in iframe

# Verify data flow:
# ✅ API returns correct proof metadata
# ✅ Page displays all information
# ✅ No sensitive data exposed
# ✅ Shareable URL works for anyone
# ✅ Embed works on third-party sites
```

---

## Edge Cases to Test

### Security Tests

```bash
# Test 1: Verify no field values in public response
curl http://localhost:3000/api/verify/public/[proofId] | \
  grep -i "value" && echo "⚠️ May be exposing field values" || echo "✅ No field values"

# Test 2: Verify no document images
curl http://localhost:3000/api/verify/public/[proofId] | \
  grep -i "image_url" && echo "⚠️ May be exposing images" || echo "✅ No image URLs"

# Test 3: Test CORS from different origin
curl -H "Origin: https://evil.com" \
  http://localhost:3000/api/verify/public/[proofId] \
  -v | grep -i "access-control"
```

### Error Handling Tests

```bash
# Test malformed proof ID
curl http://localhost:3000/api/verify/public/abc-123-xyz
# Expected: 404 or validation error

# Test SQL injection attempt
curl http://localhost:3000/api/verify/public/'; DROP TABLE proofs; --
# Expected: Safe error handling, no SQL execution

# Test XSS attempt
curl http://localhost:3000/api/verify/public/<script>alert('xss')</script>
# Expected: Sanitized response
```

### Performance Tests

```bash
# Test response time
time curl http://localhost:3000/api/verify/public/[proofId]
# Expected: < 500ms

# Test cache headers
curl -I http://localhost:3000/api/verify/public/[proofId] | grep -i "cache-control"
# Expected: Cache-Control: public, max-age=300

# Test concurrent requests
for i in {1..10}; do
  curl http://localhost:3000/api/verify/public/[proofId] &
done
wait
# All should succeed
```

---

## Browser Compatibility Testing

Test in multiple browsers:

| Browser | Verification Page | Embed Widget | Badge Components | Status |
|---------|------------------|--------------|------------------|--------|
| Chrome (latest) | | | | ⬜️ |
| Firefox (latest) | | | | ⬜️ |
| Safari (latest) | | | | ⬜️ |
| Edge (latest) | | | | ⬜️ |
| Mobile Safari (iOS) | | | | ⬜️ |
| Chrome Mobile (Android) | | | | ⬜️ |

---

## Success Criteria

Hour 6 is complete when:

- ✅ All 34 test cases pass
- ✅ Public API endpoint returns correct data
- ✅ No sensitive data is exposed in public responses
- ✅ Verification badges render correctly in all variations
- ✅ Verification page displays all information properly
- ✅ Embed widget works in iframe on third-party sites
- ✅ Shareable URLs work without authentication
- ✅ Copy link and embed code functionality works
- ✅ All automated tests pass (67/67)
- ✅ Responsive design works on mobile and desktop
- ✅ Loading and error states work correctly
- ✅ CORS headers allow cross-origin access
- ✅ Cache headers improve performance

---

## Common Issues and Solutions

### Issue: CORS errors when testing embed
**Solution:** Ensure OPTIONS handler returns proper CORS headers

### Issue: Widget not loading in iframe
**Solution:** Check Content-Security-Policy headers, ensure iframe-compatible design

### Issue: Slow API response times
**Solution:** Verify caching is enabled, optimize database queries

### Issue: Sensitive data visible in public API
**Solution:** Review API response filtering, ensure only metadata is returned

### Issue: Badge components not rendering
**Solution:** Check React client component directive, verify imports

---

## Next Steps After Hour 6

Once all tests pass:

1. ✅ Commit all Hour 6 changes
2. ✅ Push to `feature/eigencompute` branch
3. ✅ Update documentation
4. ✅ Share shareable URL examples with team
5. ✅ Prepare demo of public verification flow
6. ➡️ Move to Hour 7: Testing & Demo Preparation

---

_This test report should be completed before proceeding to Hour 7._

