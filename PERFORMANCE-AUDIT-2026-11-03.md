# Performance Audit Report — ehtishamnazeer.site
**Date:** 2026-11-03 | **Auditor:** Babuu | **Method:** Live curl measurements from server

---

## Executive Summary

| Metric | Value | Verdict |
|--------|-------|---------|
| HTML load (avg) | 0.85s | ✅ Good |
| Full page interactive | ~3-4s | ⚠️ Needs work |
| Biggest bottleneck | Tidio chat (1.59s) | 🔴 Slowest resource |
| Image delivery | GitHub raw (slow origin) | ⚠️ No CDN |

---

## 1. Page Load Times (HTML only)

| Page | TTFB | Total | Size | Verdict |
|------|------|-------|------|---------|
| index.html | 1.01s | 1.04s | 16 KB | ⚠️ TTFB high |
| experience.html | 0.62s | 0.67s | 11.8 KB | ✅ Good |
| projects.html | 0.82s | 0.89s | 42.7 KB | ✅ Good |
| contact.html | 0.75s | 0.76s | 8 KB | ✅ Good |

**Finding:** HTML itself loads fast. TTFB (0.6-1.0s) is Vercel edge latency — acceptable.

---

## 2. Resource Breakdown (what loads after HTML)

| Resource | Size | Load Time | Impact |
|----------|------|-----------|--------|
| styles.css | 43.8 KB | 0.73s | Render-blocking |
| motion.js | 10 KB | 0.70s | Deferred ✅ |
| GSAP | 72 KB | 0.86s | Deferred ✅ |
| ScrollTrigger | 43 KB | 0.70s | Deferred ✅ |
| Lenis | 13 KB | 0.81s | Deferred ✅ |
| Google Fonts CSS | 2.4 KB | 0.79s | Render-blocking ⚠️ |
| **Tidio chat** | **6.5 KB** | **1.59s** | **🔴 SLOWEST** |
| Hero image | 196 KB | 1.06s | Above fold ⚠️ |

**Total JS:** ~140 KB (all deferred, non-blocking ✅)
**Total critical path:** HTML (1s) + CSS (0.7s) + Fonts (0.8s) = ~2.5s before styled text

---

## 3. Feature-by-Feature Analysis

### 🟢 Lenis Smooth Scroll
- **Status:** Working, 13 KB, loads in 0.81s (deferred)
- **Impact:** Zero render-blocking. Smooth scroll activates after load.
- **Verdict:** ✅ No performance issue. Premium feel preserved.

### 🔴 Tidio Support Chat (Hayato)
- **Status:** Loads in **1.59s** — SLOWEST single resource
- **Impact:** Chat bubble appears late. Tidio then loads its own heavy widget (~500KB+).
- **Why slow:** Tidio's server is slow to respond, not our code.
- **Verdict:** 🔴 Biggest bottleneck. Nothing we can do about Tidio's server speed except delay it (which you asked to remove).

### ⚠️ Image Loading
- **Projects page:** 67 images, 65 use thumbnails (~34 KB each, 0.6s per image)
- **Hero image:** 196 KB, 1.06s from GitHub raw
- **Problem:** GitHub raw.githubusercontent.com is a SLOW origin (no CDN, no caching headers)
- **Verdict:** ⚠️ Works but slow. Every image takes 0.6-1.0s.

### ⚠️ Google Fonts
- **Status:** 3 font families, CSS takes 0.79s, then font files download
- **Impact:** "EN" text on orb uses Barlow Condensed — appears late until font loads
- **Verdict:** ⚠️ Causes the "EN late" issue you reported.

---

## 4. Mobile vs Desktop

| Metric | Mobile | Desktop | Verdict |
|--------|--------|---------|---------|
| HTML load | 0.78s | 0.65s | ✅ Similar |
| Page weight | Same | Same | ⚠️ No mobile-specific optimization |
| Hidden on mobile | 8 elements | — | ✅ Some optimization |

**Finding:** Same assets served to mobile and desktop. Mobile gets no lighter version.

---

## 5. Where Time Goes (Waterfall)

```
0.0s  ━━━ HTML starts
0.6s  ━━━ HTML received (TTFB)
0.6s  ━━━ CSS + Fonts + JS start loading (parallel)
1.3s  ━━━ CSS loaded → page gets styled
1.4s  ━━━ Fonts loaded → "EN" appears correctly
1.5s  ━━━ JS loaded → Lenis + animations activate
1.6s  ━━━ Hero image loaded
2.2s  ━━━ Tidio chat appears (SLOWEST)
3.0s+ ━━━ All thumbnails loaded (projects page)
```

**Total to interactive:** ~2.5s on fast connection, 5-10s on slow (like your 10KB/s)

---

## 6. Recommendations (Priority Order)

### 🔴 HIGH IMPACT

1. **Move images to Vercel (not GitHub raw)**
   - Current: 0.6-1.0s per image from slow GitHub origin
   - Fix: Serve from `/images/` on Vercel (same domain, edge cached)
   - Impact: Images load 3-5x faster
   - Effort: Medium (update 118 URLs, push)

2. **Self-host Google Fonts**
   - Current: 0.79s + font download from Google
   - Fix: Download .woff2 files, serve locally
   - Impact: "EN" appears instantly, no font swap
   - Effort: Low

### 🟡 MEDIUM IMPACT

3. **Tidio: Accept the slowness OR replace**
   - Tidio's server takes 1.59s (their problem, not ours)
   - Option A: Keep as-is (you wanted it fast)
   - Option B: Delay 2s (better page speed, slower chat)
   - Option C: Replace with lighter chat (major work)

4. **Reduce GSAP bundle**
   - Currently loading full GSAP (72KB) + ScrollTrigger (43KB)
   - Only using basic reveals — could use IntersectionObserver (0KB)
   - Impact: Save 115KB, ~0.8s
   - Effort: Medium (rewrite motion.js)

### 🟢 LOW IMPACT (already good)

5. ✅ Thumbnails working (65/67 images)
6. ✅ All JS deferred (non-blocking)
7. ✅ CSS is reasonable size (44KB)
8. ✅ Lenis not causing lag

---

## 7. Honest Assessment

**What's actually slow:**
1. Tidio's server (1.59s) — not fixable by us
2. GitHub raw images (0.6-1s each) — fixable by moving to Vercel
3. Google Fonts (0.79s) — fixable by self-hosting
4. Your network (10KB/s in screenshot) — not fixable by us

**What's NOT the problem:**
- Lenis (13KB, deferred, zero blocking)
- motion.js (10KB, deferred)
- HTML size (8-42KB, fast)
- CSS (44KB, reasonable)

**The site is well-optimized for what we control.** The remaining slowness is from third parties (Tidio, GitHub, Google) and network speed.
