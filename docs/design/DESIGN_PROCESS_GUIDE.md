# Design Process Guide for Ambira

**Target Audience**: Solo founders, small teams, MVP stage
**Goal**: Ship features fast without sacrificing quality
**Philosophy**: Design enough to build confidently, not perfectly

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [The 6-Phase Design Process](#the-6-phase-design-process)
3. [Tools & Resources](#tools--resources)
4. [Example: Intention Feature Walkthrough](#example-intention-feature-walkthrough)
5. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
6. [Design Checklist](#design-checklist)

---

## Quick Reference

### **For Small Features (Intention, Button, Input Field)**

**Time Budget**: 2-3 hours design → Start coding

```
User Story (15 min) → Paper Sketch (15 min) → Low-Fi Mockup (1 hour) → User Feedback (30 min) → Code
```

### **For Medium Features (New Screen, Complex Flow)**

**Time Budget**: 4-6 hours design → Start coding

```
User Story (30 min) → Paper Sketch (30 min) → Lo-Fi Mockup (2 hours) → Hi-Fi Key Screens (1 hour) → User Feedback (1 hour) → Code
```

### **For Large Features (Groups, Challenges, New Core Flow)**

**Time Budget**: 1-2 days design → Start coding

```
User Research (2 hours) → User Story + Flow Diagram (1 hour) → Paper Sketches (1 hour) → Lo-Fi Mockups (3 hours) → Hi-Fi Mockups (2 hours) → User Testing (2 hours) → Iterate → Code
```

---

## The 6-Phase Design Process

### **Phase 1: Define (15-30 minutes)**

**Don't touch design tools yet.** Answer these questions first:

#### 1.1 User Story Template

```
As a [type of user]
I want to [action/goal]
So that [benefit/outcome]
```

**Example - Intention Feature**:

```
As a student studying for exams
I want to set an intention before starting a study session
So that I stay focused and accountable to my goal
```

#### 1.2 Success Criteria

What does "done" look like?

- **Functional**: What must work?
- **UX**: What must feel good?
- **Performance**: What must be fast?
- **Accessibility**: Who must be able to use it?

**Example - Intention Feature**:

- ✅ User can optionally add intention in < 10 seconds
- ✅ Intention visible during session (motivation)
- ✅ Intention appears on feed post (social accountability)
- ✅ Intention helps with post-session reflection
- ✅ Max 280 characters (Twitter-length)
- ✅ Works on mobile and desktop
- ✅ Keyboard accessible

#### 1.3 Non-Goals (Scope Creep Killers)

What are we explicitly NOT doing (yet)?

**Example - Intention Feature**:

- ❌ Intention templates
- ❌ Goal tracking/completion analytics
- ❌ Intention streaks
- ❌ Group intentions
- ❌ AI-suggested intentions

**Why this matters**: Prevents feature bloat, keeps you focused, ships faster.

---

### **Phase 2: Sketch Flow (15-30 minutes)**

**Use pen & paper or Excalidraw** - rough boxes and arrows only.

#### 2.1 What to Sketch

- **Key screens** (not every state)
- **User flow** (arrows between screens)
- **Critical interactions** (taps, swipes, inputs)
- **Edge cases** (empty states, errors)

#### 2.2 Example Flow Template

```
┌─────────────┐
│ Entry Point │ → How do users get here?
└─────────────┘
       ↓
┌─────────────────────────────┐
│ Main Screen                 │ → Core interaction
│ [Key elements]              │
│ [Primary action]            │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ Success State               │ → Happy path result
└─────────────────────────────┘
```

#### 2.3 Sketch Checklist

- [ ] Entry point clear?
- [ ] Primary action obvious?
- [ ] Success state defined?
- [ ] Error states considered?
- [ ] Navigation/exit path clear?

**Tool**: Excalidraw (https://excalidraw.com) - Free, fast, shareable

---

### **Phase 3: Reference Existing Patterns (10-15 minutes)**

**Don't reinvent the wheel.** Study what already works.

#### 3.1 Internal References

1. **Your existing app** - Best reference library
   - Screenshot current related screens
   - Identify reusable components
   - Match existing patterns

2. **Your design system** (if you have one)
   - Colors, typography, spacing
   - Button styles, input fields
   - Icons, illustrations

#### 3.2 External References

1. **Competitors** - What do they do well?
   - Strava (for fitness tracking inspiration)
   - Discord (for study communities)
   - Forest (for focus timer)
   - Notion (for intention/goal setting)

2. **Design Inspiration**
   - **Dribbble** - Search "timer app", "goal setting", "productivity"
   - **Mobbin** - Mobile app patterns library
   - **UI Sources** - Web app patterns
   - **Figma Community** - Free templates

#### 3.3 Pattern Recognition Questions

- How do successful apps handle this interaction?
- What makes their solution feel intuitive?
- What patterns do users already know?
- Can we adapt (not copy) their approach?

---

### **Phase 4: Low-Fi Mockup (30-90 minutes)**

**Now you can open design tools.**

#### 4.1 Setup Your Workspace

1. Create new Figma file: `[Feature Name] - Mockups`
2. Set up frames:
   - **Mobile**: 375x812 (iPhone 13)
   - **Desktop**: 1440x900 (Standard laptop)
3. Import existing app screenshots for reference

#### 4.2 Design Principles for Low-Fi

- **Use grayscale** - No colors yet (forces focus on layout/flow)
- **Use placeholder text** - "Lorem ipsum" or real content
- **Boxes for images** - Don't waste time finding real photos
- **Simple shapes** - Rectangles, circles, lines only
- **No pixel-pushing** - Rough alignment is fine

#### 4.3 What to Mock Up

**For small features**:

- [ ] Main screen with new feature
- [ ] Feature in 2-3 different states (empty, filled, error)
- [ ] How it looks on mobile vs desktop (if different)

**For medium features**:

- [ ] 3-5 key screens
- [ ] User flow annotated with arrows
- [ ] One alternative approach (to compare)

**For large features**:

- [ ] Full user journey (5-10 screens)
- [ ] All major states (loading, success, error, empty)
- [ ] Mobile and desktop versions
- [ ] Interactive prototype (clickable)

#### 4.4 Figma Tips

- **Auto Layout**: Makes responsive designs easier
- **Components**: Reuse buttons, inputs, cards
- **Styles**: Save colors, text styles, effects
- **Plugins**:
  - "Content Reel" - Generate placeholder data
  - "Iconify" - Free icon library
  - "Unsplash" - Stock photos

---

### **Phase 5: Validate Before Building (15-60 minutes)**

**Show mockups to 2-5 people and ask specific questions.**

#### 5.1 Who to Test With

- **Internal**: Team members, advisors
- **External**: Potential users, existing users
- **Diversity**: Different skill levels, devices, use cases

**Where to find testers**:

- Friends/family (for quick feedback)
- Twitter/Discord communities (announce testing)
- UserTesting.com (paid, professional)
- Your existing user base (email, in-app)

#### 5.2 Testing Script Template

```
Context: "We're adding [feature] to help you [benefit]"

Task: "Imagine you want to [goal]. Walk me through how you'd do that."

Questions:
1. Where would you click first?
2. Is anything confusing?
3. What would you expect to happen next?
4. Would you use this feature? Why or why not?
5. On a scale of 1-10, how easy was that?

Wrap-up: "Any other thoughts or concerns?"
```

#### 5.3 Red Flags to Watch For

- **"Seems complicated"** → Simplify the flow
- **"I'd skip this every time"** → Make it more valuable or remove it
- **"Why would I do X?"** → Value proposition unclear
- **Long pauses** → Confusion, need clearer UI
- **Clicking wrong things** → Navigation/hierarchy issues

#### 5.4 Green Lights

- ✅ "Oh, that's easy"
- ✅ "I'd use this all the time"
- ✅ "This is like [familiar app]"
- ✅ Completes task < 30 seconds
- ✅ Smiles while using it

---

### **Phase 6: Build & Iterate**

**Start coding with design as reference, not gospel.**

#### 6.1 Development Principles

- **Ship fast, iterate faster** - Don't wait for perfect
- **Code reveals edge cases** - You'll discover issues design didn't catch
- **Real data is messy** - Test with realistic content lengths/types
- **Users surprise you** - Watch how they actually use it

#### 6.2 As You Build, Ask:

- What if the text is 10x longer than expected?
- What if the image doesn't load?
- What if the user has no data yet?
- What if they spam-click the button?
- What if they navigate away mid-flow?

#### 6.3 When to Iterate Design

**Don't go back to Figma for**:

- Minor spacing adjustments
- Color tweaks (unless accessibility issue)
- Small copy changes

**Do go back to Figma for**:

- Fundamental flow changes
- New screens/states discovered
- User confusion patterns
- Major visual bugs

#### 6.4 Launch Checklist

- [ ] Works on mobile and desktop
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Error states handled
- [ ] Loading states clear
- [ ] Empty states helpful
- [ ] Success feedback obvious
- [ ] Tested with real data
- [ ] Analytics/tracking added
- [ ] Rollback plan ready

---

## Tools & Resources

### **Design Tools**

| Tool           | Best For           | Cost              | Learning Curve |
| -------------- | ------------------ | ----------------- | -------------- |
| **Figma**      | Everything         | Free → $12/mo     | Medium         |
| **Excalidraw** | Quick sketches     | Free              | Low            |
| **Whimsical**  | User flows         | Free → $10/mo     | Low            |
| **FigJam**     | Whiteboarding      | Free (with Figma) | Low            |
| **Miro**       | Team collaboration | Free → $8/mo      | Medium         |

**Recommendation**: Figma for mockups, Excalidraw for sketches.

### **Inspiration Sources**

- **Dribbble** (dribbble.com) - Visual design inspiration
- **Mobbin** (mobbin.com) - Mobile app patterns ($9/mo, worth it)
- **UI Sources** (uisources.com) - Web app patterns
- **Figma Community** (figma.com/community) - Free templates
- **Really Good UX** (reallygoodux.io) - UX pattern library
- **Page Flows** (pageflows.com) - User flow recordings

### **Learning Resources**

**For Beginners**:

- Figma's Official Tutorials (free)
- Refactoring UI (book, $99) - Best investment for devs learning design
- Laws of UX (lawsofux.com) - Psychology principles

**For Intermediate**:

- Design Details Podcast
- Growth.Design case studies
- Nielsen Norman Group articles (free)

**For Advanced**:

- Interaction Design Foundation (courses)
- Design Systems guides (Shopify Polaris, Material Design)

---

## Example: Intention Feature Walkthrough

### **Phase 1: Define (15 minutes)**

**User Story**:

```
As a student studying for exams
I want to set an intention before starting a study session
So that I stay focused and accountable to my goal
```

**Success Criteria**:

- User can optionally add intention in < 10 seconds
- Intention visible during session (motivation)
- Intention appears on feed post (social accountability)
- Max 280 characters

**Non-Goals**:

- ❌ Intention templates
- ❌ Goal completion tracking
- ❌ Intention analytics

---

### **Phase 2: Sketch (15 minutes)**

```
┌─────────────────────────────┐
│ Timer Start Screen          │
│                              │
│ [Activity: Coding ▼]        │
│                              │
│ What do you want to         │
│ accomplish? (optional)       │
│ ┌─────────────────────────┐ │
│ │ Finish login endpoint   │ │
│ └─────────────────────────┘ │
│                              │
│     [Start Timer] button     │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ Timer Running               │
│ 💡 Finish login endpoint    │ ← Intention shown
│ ⏱️  00:15:32                │
│ [Pause] [Finish]            │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ Finish Modal                │
│ Did you accomplish:         │
│ "Finish login endpoint"?    │
│                              │
│ [Post Session]              │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ Feed Card                   │
│ Sarah · 2h ago              │
│ 💡 Finish login endpoint    │ ← Intention in feed
│ ⏱️ 1h 23m Coding            │
│ 👍 2 supports               │
└─────────────────────────────┘
```

---

### **Phase 3: Reference (10 minutes)**

**Internal**:

- Current timer start screen (screenshot)
- Session finish modal (screenshot)
- Feed card layout (screenshot)

**External Inspiration**:

- **Strava**: "Today's Goal" feature
- **Forest**: Focus message before starting
- **Notion**: Quick capture input
- **Twitter**: 280 character limit pattern

---

### **Phase 4: Mockup (1 hour)**

**Figma File Structure**:

```
📁 Intention Feature Mockups
  📄 Timer Start (with intention input)
  📄 Timer Running (with intention visible)
  📄 Finish Modal (with intention reminder)
  📄 Feed Card (with intention display)
  📄 Mobile Versions
```

**Key Design Decisions**:

1. **Input placement**: Above "Start" button (last thing before action)
2. **Visual indicator**: 💡 emoji for "intention"
3. **Character limit**: 280 (Twitter-style, shown as "280/280")
4. **Optional label**: "(optional)" to reduce pressure
5. **Placeholder**: "e.g., Finish 3 Pomodoros, Read Chapter 5"

---

### **Phase 5: Validate (30 minutes)**

**Tested with**: 3 students, 1 developer, 1 non-tech user

**Questions Asked**:

1. "Where would you add your intention?" → All found input immediately
2. "Does this slow down starting?" → 2 said no, 1 said "maybe but worth it"
3. "Would you use this?" → 4 yes, 1 "sometimes"

**Feedback**:

- ✅ "Love seeing my intention during the session"
- ✅ "Makes me more accountable"
- ⚠️ "Sometimes I don't know my intention yet" → Confirmed optional is right
- 💡 "Could you suggest intentions?" → Added to v2 backlog

**Changes Made**:

- Made placeholder text more helpful
- Added "Skip" option for power users
- Increased font size for intention display

---

### **Phase 6: Build (4-6 hours)**

**Implementation Steps**:

1. ✅ Add `intention?: string` to Session type
2. ✅ Add state to SessionTimerEnhanced
3. ✅ Add input field to timer start UI
4. ✅ Display intention during timer
5. ✅ Show in finish modal
6. ✅ Display on feed cards
7. ✅ Update Firestore rules
8. ✅ Write tests
9. ✅ Deploy to staging
10. ✅ Get final user feedback
11. ✅ Ship to production

**Edge Cases Discovered**:

- What if intention is just emojis? → Allow it
- What if they paste 1000 characters? → Trim to 280
- What if HTML/script tags? → Sanitize input
- What if they want to edit intention mid-session? → v2 feature

---

## Anti-Patterns to Avoid

### **❌ Design Theater**

**What it is**: Spending weeks in Figma creating pixel-perfect designs that never ship.

**Why it's bad**: You're optimizing the wrong thing. Real user feedback > perfect mockups.

**Do instead**: Design just enough to build confidently, then iterate based on usage.

---

### **❌ Design by Committee**

**What it is**: Getting 10 people's opinions and trying to satisfy everyone.

**Why it's bad**: Dilutes vision, creates Frankenstein features, slows progress.

**Do instead**: Get feedback from 2-3 target users, make a decision, move on.

---

### **❌ Feature Creep in Design**

**What it is**: Adding "just one more thing" in mockups before building.

**Why it's bad**: Delays shipping, increases complexity, often unused.

**Do instead**: Ship v1, measure usage, add v2 features based on data.

---

### **❌ Designing Every Edge Case**

**What it is**: Mocking up 47 different states before writing code.

**Why it's bad**: Edge cases emerge during development, not design.

**Do instead**: Design happy path + 2-3 common states, discover rest while building.

---

### **❌ Ignoring Existing Patterns**

**What it is**: Creating novel interactions for common problems.

**Why it's bad**: Increases learning curve, wastes time, often worse UX.

**Do instead**: Copy proven patterns shamelessly, innovate only where it matters.

---

### **❌ No User Validation**

**What it is**: Designing in isolation, assuming you know what users want.

**Why it's bad**: Your assumptions are probably wrong.

**Do instead**: Show rough mockups to users early and often.

---

### **❌ Perfectionism Paralysis**

**What it is**: Tweaking spacing by 2px for hours, changing colors 47 times.

**Why it's bad**: Diminishing returns, delayed shipping, wasted time.

**Do instead**: "Good enough" is good enough. Ship, gather data, iterate.

---

## Design Checklist

### **Before You Start Designing**

- [ ] User story written
- [ ] Success criteria defined
- [ ] Non-goals listed
- [ ] Existing patterns reviewed
- [ ] Inspiration gathered

### **After Sketching**

- [ ] User flow is clear
- [ ] Primary action is obvious
- [ ] Entry and exit points defined
- [ ] Happy path sketched
- [ ] Error states considered

### **After Mockups**

- [ ] Matches existing design system
- [ ] Works on mobile and desktop
- [ ] Accessible (contrast, keyboard nav)
- [ ] Loading states shown
- [ ] Empty states designed
- [ ] Error states handled

### **Before Building**

- [ ] Tested with 2-3 users
- [ ] Feedback incorporated
- [ ] Edge cases documented
- [ ] Analytics events planned
- [ ] Team aligned on scope

### **Before Shipping**

- [ ] Works with real data
- [ ] Keyboard accessible
- [ ] Screen reader tested
- [ ] Error handling works
- [ ] Analytics implemented
- [ ] Performance acceptable
- [ ] Cross-browser tested
- [ ] Mobile responsive

---

## Quick Decision Framework

### **Should I Design This?**

| If...                   | Then...        |
| ----------------------- | -------------- |
| New screen/feature      | Yes, design it |
| Small UI tweak          | Just code it   |
| Copy change             | Just code it   |
| Complex interaction     | Yes, design it |
| New user flow           | Yes, design it |
| Bug fix                 | Just code it   |
| Refactor (no UI change) | Just code it   |

### **How Much Should I Design?**

| Complexity                  | Design Time | What to Create            |
| --------------------------- | ----------- | ------------------------- |
| **Trivial** (button, label) | 0 min       | Nothing, just code        |
| **Small** (input, card)     | 15-30 min   | Quick sketch              |
| **Medium** (new screen)     | 1-2 hours   | Lo-fi mockups             |
| **Large** (new flow)        | 4-8 hours   | Hi-fi mockups + prototype |
| **Huge** (new core feature) | 1-2 days    | Full design + testing     |

### **When Should I Test?**

| Stage            | Test With     | Goal                         |
| ---------------- | ------------- | ---------------------------- |
| **Sketch**       | 1-2 people    | "Does this make sense?"      |
| **Lo-fi mockup** | 2-3 people    | "Can you complete the task?" |
| **Hi-fi mockup** | 3-5 people    | "Would you use this?"        |
| **Prototype**    | 5-10 people   | "Find any issues?"           |
| **Beta**         | 50-100 people | "Does it work at scale?"     |
| **Production**   | Everyone      | "Is it actually valuable?"   |

---

## Conclusion

**Remember**: Design is a tool to reduce risk and align teams, not an end in itself.

**The best design process is**:

1. Fast enough to not block development
2. Thorough enough to avoid major rework
3. User-centered enough to build the right thing
4. Flexible enough to adapt as you learn

**When in doubt**:

- Bias toward action over perfection
- Talk to users more than you think you should
- Ship small, iterate fast
- Copy proven patterns shamelessly
- Design is never done, features are never finished

Now go build something people love. 🚀

---

**Questions? Stuck on something?**

- Review this guide's relevant phase
- Check the [Ambira Design Checklist](./design-principles.md)
- Ask in team Slack/Discord
- Show rough mockups for quick feedback

**Last Updated**: 2025-11-05
**Maintained By**: Ambira Design Team
