# TrustDocs Integration Test Report

**Date:** October 10, 2025  
**Project:** TrustDocs - Verifiable AI Document Extraction  
**Test Suite:** Hourly Integration Testing  

## Executive Summary

This test report outlines the testing requirements and procedures for verifying the functionality of features implemented in each hour of the a16z hackathon project. Each developer should run these tests after completing their hourly tasks to ensure all components are working correctly before integration.

## Hour 1 Test Cases

### Ishrith: Frontend & UI

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| IS-1.1 | Upload interface renders correctly | Upload zone visible with drag-drop area and icon | ⬜️ |
| IS-1.2 | File drag-and-drop functionality | Files can be dragged and dropped into the upload zone | ⬜️ |
| IS-1.3 | File validation (file type) | Reject non-JPG/PNG/PDF files with appropriate error | ⬜️ |
| IS-1.4 | File validation (file size) | Reject files over 10MB with appropriate error | ⬜️ |
| IS-1.5 | Upload progress animation | Progress bar appears and animates during upload | ⬜️ |
| IS-1.6 | Image preview | Preview thumbnail appears after image upload | ⬜️ |
| IS-1.7 | History page rendering | History page loads with sample documents | ⬜️ |
| IS-1.8 | Document type icons | Each document shows appropriate icon based on type | ⬜️ |
| IS-1.9 | Responsive design | UI components adjust properly to different screen sizes | ⬜️ |

**Testing Procedure:**

1. Run the development server:
   ```
   npm run dev
   ```

2. Open a browser to `http://localhost:3000`

3. Test upload zone:
   - Drag and drop different file types (JPG, PNG, PDF, and invalid types)
   - Upload files of different sizes
   - Verify progress animation works
   - Confirm preview displays for images

4. Test history page:
   - Navigate to `/history`
   - Verify sample documents display correctly
   - Check document type icons
   - Test responsive layout at different viewport sizes

### Angad: AI/ML Integration

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| AN-1.1 | Project structure setup | Next.js project with proper directory structure | ⬜️ |
| AN-1.2 | Claude API integration | Claude client can be initialized with API key | ⬜️ |
| AN-1.3 | Basic prompt structure | Extract document prompt executes with sample inputs | ⬜️ |
| AN-1.4 | Google Cloud Vision setup | Vision API client initializes correctly | ⬜️ |
| AN-1.5 | Basic OCR extraction | Extract text from sample image with word-level boxes | ⬜️ |

**Testing Procedure:**

1. Check project structure:
   ```bash
   ls -la src/utils
   ```

2. Test Claude API integration:
   ```bash
   # Create a test script
   echo '
   import { extractDocumentData } from "../utils/claudeExtraction";
   
   async function testClaude() {
     try {
       const result = await extractDocumentData("https://example.com/sample-receipt.jpg");
       console.log("Claude extraction result:", JSON.stringify(result, null, 2));
     } catch (error) {
       console.error("Claude API test failed:", error);
     }
   }
   
   testClaude();
   ' > src/scripts/test-claude.js
   
   # Run the test script
   node src/scripts/test-claude.js
   ```

3. Test Google Vision API:
   ```bash
   # Create a test script
   echo '
   import { performOCR } from "../utils/googleVision";
   import fs from "fs";
   
   async function testVision() {
     try {
       const imageBuffer = fs.readFileSync("./sample-docs/receipt.jpg");
       const result = await performOCR(imageBuffer);
       console.log("OCR result:", JSON.stringify(result, null, 2));
     } catch (error) {
       console.error("Vision API test failed:", error);
     }
   }
   
   testVision();
   ' > src/scripts/test-vision.js
   
   # Run the test script
   node src/scripts/test-vision.js
   ```

### Aadit: Backend & Database

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| AA-1.1 | API routes setup | Next.js API routes directory structure created | ⬜️ |
| AA-1.2 | File upload endpoint | `/api/upload` accepts file uploads | ⬜️ |
| AA-1.3 | Upload validation | Endpoint validates file types and sizes | ⬜️ |
| AA-1.4 | Supabase client | Can initialize Supabase connection | ⬜️ |
| AA-1.5 | Environment variables | Required env vars are defined and loaded | ⬜️ |

**Testing Procedure:**

1. Check API routes structure:
   ```bash
   ls -la src/app/api
   ```

2. Test upload endpoint using curl:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@./sample-docs/receipt.jpg" \
     -v
   ```

3. Test file validation with invalid file:
   ```bash
   # Create a test file over 10MB
   dd if=/dev/zero of=large-file.bin bs=1M count=15
   
   # Test with invalid file
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@./large-file.bin" \
     -v
   ```

4. Test Supabase connection:
   ```bash
   # Create a test script
   echo '
   import { createClient } from "@supabase/supabase-js";
   
   async function testSupabase() {
     try {
       const supabase = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
       );
       const { data, error } = await supabase.from("documents").select("*").limit(1);
       console.log("Supabase connection test:", error ? "Failed" : "Successful");
       console.log("Data:", data);
     } catch (error) {
       console.error("Supabase test failed:", error);
     }
   }
   
   testSupabase();
   ' > src/scripts/test-supabase.js
   
   # Run the test script
   node -r dotenv/config src/scripts/test-supabase.js
   ```

### Aditya: Cryptography & Verification

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| AD-1.1 | Document proof structure | Proof structure data model defined | ⬜️ |
| AD-1.2 | SHA-256 hashing | Can generate document hash from file buffer | ⬜️ |
| AD-1.3 | Field-level proof generation | Can create proof object for extracted field | ⬜️ |
| AD-1.4 | JSON canonicalization | Consistently formats JSON for hashing | ⬜️ |
| AD-1.5 | Proof hash validation | Can verify proof hash against original document | ⬜️ |

**Testing Procedure:**

1. Test document hashing:
   ```bash
   # Create a test script
   echo '
   import crypto from "crypto";
   import fs from "fs";
   
   function generateDocHash(fileBuffer) {
     return crypto.createHash("sha256").update(fileBuffer).digest("hex");
   }
   
   function testHashing() {
     try {
       const fileBuffer = fs.readFileSync("./sample-docs/receipt.jpg");
       const hash = generateDocHash(fileBuffer);
       console.log("Document hash:", hash);
       
       // Hash should be consistent
       const hash2 = generateDocHash(fileBuffer);
       console.log("Consistent hash:", hash === hash2);
       
       // Hash should change with modified file
       const modifiedBuffer = Buffer.concat([fileBuffer, Buffer.from([1, 2, 3])]);
       const modifiedHash = generateDocHash(modifiedBuffer);
       console.log("Modified hash different:", hash !== modifiedHash);
     } catch (error) {
       console.error("Hashing test failed:", error);
     }
   }
   
   testHashing();
   ' > src/scripts/test-hashing.js
   
   # Run the test script
   node src/scripts/test-hashing.js
   ```

2. Test field-level proof generation:
   ```bash
   # Create a test script
   echo '
   import crypto from "crypto";
   
   function generateFieldProof(docHash, fieldName, value, boundingBox) {
     const proof = {
       docHash,
       fieldName,
       value,
       boundingBox,
       confidence: 0.95,
       timestamp: new Date().toISOString()
     };
     
     const canonicalProof = JSON.stringify(proof, Object.keys(proof).sort());
     const proofHash = crypto.createHash("sha256").update(canonicalProof).digest("hex");
     
     return { proof, proofHash };
   }
   
   function testProofGeneration() {
     const docHash = "8f3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c";
     const fieldName = "total";
     const value = "123.45";
     const boundingBox = { x: 100, y: 200, width: 50, height: 20 };
     
     const { proof, proofHash } = generateFieldProof(docHash, fieldName, value, boundingBox);
     console.log("Field proof:", proof);
     console.log("Proof hash:", proofHash);
     
     // Test canonicalization
     const { proofHash: proofHash2 } = generateFieldProof(docHash, fieldName, value, boundingBox);
     console.log("Consistent proof hash:", proofHash === proofHash2);
   }
   
   testProofGeneration();
   ' > src/scripts/test-proof.js
   
   # Run the test script
   node src/scripts/test-proof.js
   ```

## Integration Testing

After each developer completes their individual tests, run these integration tests to ensure components work together:

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| INT-1.1 | End-to-end upload flow | File uploads via UI and returns docId from API | ⬜️ |
| INT-1.2 | History page API integration | History page loads documents from API | ⬜️ |

**Integration Testing Procedure:**

1. Start the development server:
   ```
   npm run dev
   ```

2. Test end-to-end upload flow:
   - Upload a document through the UI
   - Check browser console for docId response
   - Verify upload success notification

3. Test history page integration:
   - Navigate to `/history`
   - Verify documents load from API endpoint
   - Confirm document details display correctly

## How to Use This Test Report

1. Each developer should complete their assigned tasks for the current hour
2. Run the specific tests for their role to verify functionality
3. Mark each test as:
   - ✅ PASSED (all requirements met)
   - ⚠️ PARTIAL (some functionality working)
   - ❌ FAILED (not working as expected)
4. Document any issues encountered
5. Share test results with the team
6. Fix any failing tests before proceeding to the next hour

## Best Practices

1. Create sample test files:
   - Small/medium/large JPG files
   - PNG files with transparency
   - Single and multi-page PDFs
   - Invalid file types for testing validation

2. Use consistent sample data:
   - Standardized receipt format
   - Consistent field naming
   - Predictable data structures

3. Test edge cases:
   - Empty files
   - Extremely large files
   - Malformed data
   - Non-English characters
   - Different receipt layouts

## Hour 2 Test Cases

*(To be added after Hour 1 is completed and verified)*

---

*This test report will be updated after each hour to include new test cases for newly implemented features.*