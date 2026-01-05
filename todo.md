# Project TODO

## Comprehensive Template Management System

### Phase 1: Research & Architecture
- [ ] Research best-in-class invoicing systems (FreshBooks, QuickBooks, Wave, Zoho Invoice)
- [ ] Design template system architecture with clear separation of concerns
- [ ] Define user flows for template management
- [ ] Define user flows for invoice creation with templates
- [ ] Document edge cases and error scenarios

### Phase 2: Code Cleanup
- [x] Delete Templates.old.tsx duplicate file
- [x] Remove automatic initialization logic
- [x] Clean up confusing variable names
- [x] Add clear comments to all template-related code

### Phase 3: Template Library
- [x] Create 6 unique, non-duplicate pre-made templates
- [x] Add template preview thumbnails/cards
- [x] Implement "Initialize Default Templates" button (manual, not automatic)
- [x] Add empty state with clear call-to-action
- [x] Show template count and categories (preset vs custom)

### Phase 4: Template CRUD Operations
- [x] Create new template (from scratch or from preset)
- [x] Edit existing template with live preview
- [x] Delete template with confirmation
- [x] Duplicate template functionality (can use edit + save as new)
- [x] Set default template
- [x] Validate template data before save

### Phase 5: Invoice Creation Integration
- [x] Add template selector dropdown in Create Invoice form
- [x] Show template preview thumbnail in selector (color indicator)
- [x] Allow template override per invoice
- [x] Update backend to accept and store templateId
- [x] Add template selector to Edit Invoice form

### Phase 6: Invoice Preview
- [x] Add "Preview Invoice" button before finalizing (already exists)
- [x] Show full invoice with selected template applied
- [x] Allow template switching in preview mode
- [x] Template styling (colors, fonts) applied to preview

### Phase 7: Edge Cases & Error Handling
- [x] Handle user with no templates (show initialize button in empty state)
- [x] Handle deleting default template (backend prevents deletion)
- [x] Handle deleting template used by existing invoices (allowed, invoices fallback to default)
- [x] Handle network errors during template operations (tRPC error handling)
- [x] Handle invalid template data (Zod validation on backend)
- [x] Add loading states for all async operations (loading skeletons)
- [x] Add success/error toast notifications (sonner toasts)

### Phase 8: Testing & Delivery
- [x] Write comprehensive vitest tests for all flows
- [x] Test template CRUD operations (8 tests passing)
- [x] Test template field validation (4 tests passing)
- [x] Test template initialization (1 test passing)
- [x] Test all edge cases (delete default, field visibility)
- [x] All 13 tests passing
- [x] Save final checkpoint

## Console Warning Cleanup
- [x] Suppress benign ResizeObserver warnings in browser console

## Template System Cleanup
- [x] Audit database for duplicate templates
- [x] Remove duplicate templates, keep only 6 unique presets (verified: 0 duplicates found)
- [x] Verify template initialization creates no duplicates

## Icon System Overhaul
- [x] Research icon best practices (strategic vs decorative usage)
- [x] Audit current icon usage across all pages (48 files analyzed)
- [x] Choose optimal icon system (keeping Lucide React)
- [x] Define icon usage guidelines (navigation, actions, status only)
- [x] Remove decorative/unnecessary icons (10 instances removed)
- [x] Implement strategic icon placement
- [x] Ensure consistent icon sizing and spacing
## Logo Upload Feature

### Phase 1: Logo Upload UI
- [x] Create logo upload UI component in Templates editor
- [x] Add file input with drag-drop support
- [x] Add preview and remove functionality

### Phase 2: Backend S3 Upload
- [x] Implement S3 upload endpoint on backend (/api/upload/logo)
- [x] Use multer for file handling
- [x] Use @aws-sdk/client-s3 for S3 integration
- [x] Return public URL from S3

### Phase 3: Template Preview Logo Display
- [x] Update TemplatePreview component to display uploaded logo
- [x] Apply logoPosition (left/center/right) styling
- [x] Apply logoWidth setting
- [x] Show placeholder when no logo uploaded

### Phase 4: Invoice Preview Modal Logo Display
- [x] Update InvoicePreviewModal to display template logo
- [x] Apply template logo settings in invoice preview
- [x] Logo displays correctly with all header layouts

### Phase 5: PDF Generation Logo
- [x] Update server/pdf.ts to include logo from template
- [x] Apply logoUrl, logoPosition, and logoWidth in PDF
- [x] Logo renders correctly in generated PDFs

### Phase 6: Comprehensive Testing
- [x] Create 14 comprehensive vitest tests
- [x] Test logo URL storage (S3 URLs, null handling)
- [x] Test logo positioning (left, center, right)
- [x] Test logo width settings (80-200px)
- [x] Test file format support (PNG, JPG, SVG)
- [x] Test logo with template customization
- [x] Test multiple templates with different logos
- [x] All 14 tests passing


## Logo Image Optimization Feature

### Phase 1: Research and Planning
- [ ] Research image optimization best practices (compression, formats, quality)
- [ ] Evaluate Sharp library for image processing
- [ ] Plan optimization strategy (WebP conversion, quality levels, size limits)
- [ ] Design fallback format support (PNG, JPG, SVG)

### Phase 2: Dependencies
- [ ] Install Sharp library for image processing
- [ ] Configure Sharp for optimal performance
- [ ] Add TypeScript types for Sharp

### Phase 3: Optimization Utilities
- [ ] Create image optimization utility functions
- [ ] Implement WebP conversion with fallback
- [ ] Implement JPEG compression
- [ ] Implement PNG optimization
- [ ] Add file size validation and limits

### Phase 4: Upload Endpoint Integration
- [ ] Update /api/upload/logo endpoint to use optimization
- [ ] Apply optimization before S3 upload
- [ ] Return optimized image URL
- [ ] Handle optimization errors gracefully

### Phase 5: Format Support
- [ ] Support PNG format with optimization
- [ ] Support JPG/JPEG format with compression
- [ ] Support SVG format (pass-through, no compression)
- [ ] Support WebP format (pass-through)
- [ ] Add format detection and validation

### Phase 6: Testing
- [ ] Create image optimization tests
- [ ] Test WebP conversion
- [ ] Test JPEG compression
- [ ] Test PNG optimization
- [ ] Test SVG handling
- [ ] Test file size validation
- [ ] Test error handling

### Phase 7: Documentation and Delivery
- [ ] Update API documentation
- [ ] Document optimization settings
- [ ] Save checkpoint with optimization feature

## Logo Image Optimization Feature

### Phase 1: Research and Planning
- [x] Research image optimization best practices
- [x] Evaluate Sharp library for image processing
- [x] Plan optimization strategy
- [x] Design fallback format support

### Phase 2: Dependencies
- [x] Install Sharp library (v0.34.5)
- [x] Configure Sharp for optimal performance

### Phase 3: Optimization Utilities
- [x] Create image optimization utility functions
- [x] Implement WebP conversion with fallback
- [x] Implement JPEG compression (quality: 85)
- [x] Implement PNG optimization (compression: 9)
- [x] Add file size validation (5MB max)
- [x] Format detection from buffer signatures

### Phase 4: Upload Endpoint Integration
- [x] Update /api/upload/logo endpoint with optimization
- [x] Apply optimization before S3 upload
- [x] Return optimized URL with metrics
- [x] Return compression ratio and size savings

### Phase 5: Format Support
- [x] Support PNG format with optimization
- [x] Support JPG/JPEG format with compression
- [x] Support SVG format (pass-through)
- [x] Support WebP format (pass-through)
- [x] Automatic MIME type detection

### Phase 6: Testing
- [x] Create comprehensive tests (37 tests)
- [x] Test format detection
- [x] Test file validation
- [x] Test compression and optimization
- [x] Test error handling
- [x] All 37 tests passing

### Phase 7: Documentation and Delivery
- [x] Update API documentation
- [x] Document optimization settings
- [x] Document supported formats
- [x] Save checkpoint with feature
