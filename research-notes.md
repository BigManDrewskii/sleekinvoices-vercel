# Sleek - Default Template Research Notes

## Google Fonts API Integration

### API Endpoint
```
https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR-API-KEY&sort=popularity
```

### Response Structure
Each font family includes:
- `family`: Font name (e.g., "Anonymous Pro")
- `variants`: Available weights/styles (e.g., ["regular", "italic", "700", "700italic"])
- `category`: Font type (serif, sans-serif, monospace, display, handwriting)
- `subsets`: Language support (latin, cyrillic, greek, etc.)

### Loading Fonts Dynamically
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Font+Name:400,500,600,700&display=swap">
```

### Weight Mapping
- 100: Thin
- 200: Extra Light
- 300: Light
- 400: Regular
- 500: Medium
- 600: Semi Bold
- 700: Bold
- 800: Extra Bold
- 900: Black

### Implementation Strategy
1. Fetch font list from Google Fonts API (sorted by popularity)
2. Cache the font list locally to avoid repeated API calls
3. Create a searchable font picker with category filters
4. Load selected fonts dynamically using CSS link injection
5. Store font preferences in template settings

## Invoice Design Best Practices

### Key Elements
1. **Header**: Logo, company name, "INVOICE" label
2. **Invoice Details**: Invoice #, date, due date
3. **Parties**: From (your business) and Bill To (client)
4. **Line Items**: Description, quantity, rate, amount
5. **Totals**: Subtotal, discounts, tax, total due
6. **Payment Terms**: Due date, payment methods, notes
7. **Footer**: Thank you message, contact info

### Design Principles
1. **Whitespace**: Use generous spacing for readability
2. **Hierarchy**: Clear visual distinction between sections
3. **Consistency**: Uniform fonts, colors, and alignment
4. **Professionalism**: Clean, minimal design builds trust
5. **Branding**: Logo and colors reflect company identity

## Color System (Simple - 4 Colors)

### Primary Color
- Used for: Headers, invoice title, key labels
- Default: Brand blue (#5f6fff)

### Secondary Color
- Used for: Section headers, table headers, borders
- Default: Dark slate (#252f33)

### Accent Color
- Used for: Highlights, totals, call-to-action elements
- Default: Emerald green (#10b981)

### Background Color
- Used for: Invoice background, alternating rows
- Default: White (#ffffff)

## Editor Sidebar Structure (Accordion)

### Section 1: Brand Identity
- Template name
- Logo upload
- Logo position (left, center, right)

### Section 2: Colors
- Primary color picker
- Secondary color picker
- Accent color picker
- Background color picker
- Quick presets (8-10 color schemes)

### Section 3: Typography
- Heading font (Google Fonts picker)
- Body font (Google Fonts picker)
- Font weight options
- Font size scale

### Section 4: Layout
- Header style (minimal, standard, bold)
- Table style (simple, bordered, striped)
- Alignment options

### Section 5: Fields
- Toggle visibility for optional fields
- Custom field labels

### Section 6: Footer
- Date format
- Payment terms
- Thank you message
