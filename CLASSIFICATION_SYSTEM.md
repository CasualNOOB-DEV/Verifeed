# Verifeed Classification System

## Why Classifications Instead of Numeric Scores?

**Problem with numeric scores (0-100):**
- Implies false precision - what does "85% true" actually mean?
- No mathematical basis for the specific number
- AI just makes up a number based on vibes
- Can be questioned and undermined

**Benefits of classifications:**
- Honest about AI limitations
- Matches how professional fact-checkers work (PolitiFact, Snopes, FactCheck.org)
- More defensible and trustworthy
- Easier for users to understand
- Can still use color coding for visual clarity

---

## The 6 Ratings

### 🟢 TRUE
**What it means:** The claim is accurate and supported by reliable sources.

**Color:** Dark Green (#22c55e)

**Example:** "The Earth orbits the Sun"

---

### 🟢 MOSTLY TRUE  
**What it means:** The claim is mostly accurate but needs clarification or additional context.

**Color:** Light Green (#86efac)

**Example:** "Vaccines prevent disease" (true, but doesn't specify which vaccines/diseases)

---

### 🟡 MIXED
**What it means:** The claim contains both true and false elements, or is misleading.

**Color:** Yellow (#fbbf24)

**Example:** "COVID vaccines are 100% effective" (effective yes, but not 100%)

---

### 🟠 MOSTLY FALSE
**What it means:** The claim has an element of truth but ignores critical facts or is significantly inaccurate.

**Color:** Orange (#fb923c)

**Example:** "5G causes COVID" (5G exists, but it doesn't cause COVID)

---

### 🔴 FALSE
**What it means:** The claim is demonstrably false or contradicts established facts.

**Color:** Red (#ef4444)

**Example:** "The Earth is flat"

---

### ⚪ UNVERIFIABLE
**What it means:** The claim cannot be verified with available knowledge/sources.

**Color:** Gray (#9ca3af)

**Example:** "Aliens visited Earth in 1947" (no verifiable evidence)

---

## AI Prompt Instructions

The AI is given these instructions:

```
RATING DEFINITIONS (use these exact labels):
- TRUE: The claim is accurate and supported by reliable sources
- MOSTLY_TRUE: The claim is mostly accurate but needs clarification or additional context
- MIXED: The claim contains both true and false elements, or is misleading
- MOSTLY_FALSE: The claim has an element of truth but ignores critical facts
- FALSE: The claim is demonstrably false or contradicts established facts
- UNVERIFIABLE: The claim cannot be verified with available knowledge/sources
```

---

## Response Format

The AI returns:

```json
{
  "rating": "TRUE",
  "confidence": 95,
  "bias": "center",
  "biasConfidence": 80,
  "explanation": "The Earth is an oblate spheroid, confirmed by satellite imagery...",
  "sources": ["NASA", "Scientific consensus", "Direct satellite observation"]
}
```

**Key fields:**
- `rating` - One of the 6 classifications
- `confidence` - 0-100, how confident the AI is (still useful for borderline cases)
- `bias` - left/center/right (separate analysis)
- `explanation` - 2-3 sentences explaining the rating
- `sources` - Up to 5 sources cited

---

## UI Display

### Popup
Shows a **badge** with the rating:

```
┌─────────────────────────────┐
│   Truthfulness Rating       │
│  ┌───────────────────────┐  │
│  │      MOSTLY TRUE      │  │ ← Badge with color
│  └───────────────────────┘  │
│     Confidence: 85%         │
└─────────────────────────────┘
```

### Highlights
Claims are highlighted with **color-coded underlines**:

- Before verification: Gray
- After verification: Color matches rating

---

## Comparison with Other Fact-Checkers

### PolitiFact
- True
- Mostly True
- Half True
- Mostly False
- False
- Pants on Fire

### Snopes
- True
- Mostly True
- Mixture
- Mostly False
- False
- Unproven

### FactCheck.org
- Narrative categories (varies by claim)

### **Verifeed**
- TRUE
- MOSTLY_TRUE
- MIXED
- MOSTLY_FALSE
- FALSE
- UNVERIFIABLE

We're **aligned with industry standards** while being honest about AI limitations.

---

## Technical Implementation

### Types
```typescript
type TruthRating = 
  | 'TRUE'
  | 'MOSTLY_TRUE'
  | 'MIXED'
  | 'MOSTLY_FALSE'
  | 'FALSE'
  | 'UNVERIFIABLE';

interface VerificationResponse {
  rating: TruthRating;
  confidence: number;
  bias: BiasLabel;
  biasConfidence: number;
  explanation: string;
  sources: string[];
}
```

### CSS Classes
```css
.verifeed-claim-highlight.verifeed-verified-true { ... }
.verifeed-claim-highlight.verifeed-verified-mostly-true { ... }
.verifeed-claim-highlight.verifeed-verified-mixed { ... }
.verifeed-claim-highlight.verifeed-verified-mostly-false { ... }
.verifeed-claim-highlight.verifeed-verified-false { ... }
.verifeed-claim-highlight.verifeed-verified-unverifiable { ... }
```

### Color Mapping
```typescript
const colorMap = {
  'TRUE': '#22c55e',           // Dark green
  'MOSTLY_TRUE': '#86efac',    // Light green
  'MIXED': '#fbbf24',          // Yellow
  'MOSTLY_FALSE': '#fb923c',   // Orange
  'FALSE': '#ef4444',          // Red
  'UNVERIFIABLE': '#9ca3af'    // Gray
};
```

---

## Testing Examples

### Should rate TRUE
- "Water boils at 100°C at sea level"
- "The Earth is approximately 4.5 billion years old"
- "Humans have 23 pairs of chromosomes"

### Should rate MOSTLY_TRUE
- "Vaccines prevent disease" (needs specificity)
- "Exercise is good for you" (generally true, nuance exists)

### Should rate MIXED
- "Climate change is caused by humans and natural cycles" (both factors, but human impact dominant)

### Should rate MOSTLY_FALSE
- "COVID vaccines change your DNA" (vaccines exist, but don't change DNA)

### Should rate FALSE
- "5G towers cause COVID-19"
- "The moon landing was faked"

### Should rate UNVERIFIABLE
- "Aliens exist on other planets" (no evidence either way)
- "This stock will double by next year" (future prediction)

---

## Benefits for Launch

✅ **More trustworthy** - Users won't question arbitrary percentages

✅ **More defensible** - Matches industry standards

✅ **Better UX** - Clear, simple categories

✅ **Honest** - Acknowledges AI limitations

✅ **Professional** - Aligns with real fact-checkers

✅ **Scalable** - Easy to explain and document

---

## Migration Notes

### What Changed
- Removed `score` field (0-100 number)
- Added `rating` field (classification string)
- Removed `confidence` dependency on score
- Updated all UI components
- Updated CSS classes
- Updated AI prompt

### What Stayed the Same
- Bias detection (still uses left/center/right)
- Explanation format
- Sources format
- Color coding (just mapped differently)
- Overall UX flow

### Breaking Changes
- Extension v1.0.0 requires backend v1.0.0
- Old cache entries will fail (cache will auto-clear)

---

## Future Enhancements

**Potential additions:**
- Sub-ratings per claim element (if multiple facts in one claim)
- Temporal tracking (rating changes over time as new info emerges)
- User feedback on ratings (thumbs up/down)
- Confidence thresholds (hide ratings with confidence < 50%)
- Expert override system
- Community voting

**For now:** Keep it simple and honest. Launch with 6 ratings.

---

## Summary

**Old system:** "This is 85% true"  
**User thinks:** "What does 85% even mean? Who decided that?"

**New system:** "MOSTLY TRUE - Confidence: 85%"  
**User thinks:** "OK, so it's mostly accurate with some caveats. Makes sense."

**Result:** More trust, less confusion, easier to defend.

---

Ready to launch! 🚀
