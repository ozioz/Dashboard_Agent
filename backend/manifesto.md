# Power BI UI/UX & Data Visualization Manifesto

This document serves as the absolute source of truth for auditing Power BI dashboards. Any deviation from these rules leads to a penalty score.

## 1. Layout & Grid Architecture
* **Grid Alignment:** All visuals must align perfectly to a visible or invisible grid. Misalignment of even 1-2 pixels is a violation.
* **Whitespace (Breathing Room):** There must be at least 20px padding between visuals and containers. Cluttered interfaces are rejected.
* **Narrative Flow (Z-Pattern):**
    * **BANs (Big Area Numbers):** Key KPIs must be placed at the top-left or top-center.
    * **Flow:** The reading logic must flow from High-Level KPIs -> Trends -> Detailed Tables (Top to Bottom, Left to Right).
* **No Main Scroll:** The main dashboard view must fit within a standard 16:9 canvas (1920x1080 or 1280x720) without vertical scrolling (exception: specific drill-through detail pages).

## 2. Data Visualization Best Practices (IBCS Standards)
* **Data-Ink Ratio:** Remove all non-essential ink.
    * Violation: 3D effects, shadows, excessive borders, background images that distract.
* **Chart Selection Rules:**
    * **Pie/Donut Charts:** Strictly prohibited if more than 3 categories. Use Bar Charts instead.
    * **Time Series:** Must use Line or Area charts. Never use independent bars for continuous time.
    * **Comparisons:** Use Horizontal Bar charts for categorical comparisons (e.g., Sales by Region) to allow readable labels.
* **Legends:** Avoid indirect legends where possible. Direct labeling on the chart is preferred to reduce eye movement.

## 3. Typography & Hierarchy
* **Font Consistency:** Max 1 Font Family allowed (e.g., Segoe UI, DIN, Roboto).
* **Hierarchy Scale:**
    * Page Title: 24pt+ (Bold)
    * Section Headers: 16-18pt (Semi-Bold)
    * Data Labels: 9-11pt (Regular)
* **Readability:** No vertical text on Y-axis. No slanted/angled text on X-axis (use horizontal bars instead if labels don't fit).

## 4. Color Palette & Semantics
* **3-Color Rule:** Max 3 dominant colors + Neutral Greys.
* **Semantic Integrity:**
    * **Green:** Only for "Good" performance or positive variance.
    * **Red:** Only for "Bad" performance or negative variance.
    * **Violation:** Using Red/Green for distinct categories (e.g., "Product A vs Product B") is strictly forbidden due to color blindness issues.
* **Contrast:** Background and Text contrast must meet WCAG AA standards.

## 5. Interaction & Usability
* **Slicer Panel:** Filters should not scatter around the canvas. They must be grouped in a collapsible side panel or a clean top ribbon.
* **Clear Interaction:** Visuals must have interaction turned off if they don't filter other visuals meaningfully.
* **Tooltips:** Default black tooltips are a violation. Custom Report Page Tooltips providing extra context are required.

## 6. Semantic Naming & Accessibility (Crucial for AI Analysis)
* **Descriptive Titles:** Every visual MUST have a clear, business-friendly title explaining "What, Where, and When" (e.g., "Total Sales by Region 2024"). 
    * *Violation:* Leaving titles blank or using technical defaults like "Sum of Sales by Country".
* **Business-Friendly Field Names:** All user-facing measures and columns must be renamed to natural language.
    * *Violation:* Displaying `Sum_Revenue_CY_Calc` in a tooltip or legend. It must be `Total Revenue`.