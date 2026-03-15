# Called It! — Product Spec & Knowledge Transfer

## Overview

**Called It!** is a social prediction app for friendly wagers on life's micro-moments. Think Polymarket, but for personal events among friends—reactions to pregnancy announcements, best man speech length, who shows up late to the wedding, etc.

**Core philosophy:** Optimize for fun and social engagement, not profit. The betting mechanics exist to make predictions feel meaningful, not to create a gambling platform.

---

## Core Mechanics

### Betting Model: Parimutuel Pooling

All bets go into a shared pot. Winners split the pot proportionally based on their stake.

**Why this model:**
- No need to set accurate odds upfront—the crowd sets them implicitly
- Self-balancing, works with small groups
- Simple to explain: "Bet coins, winners split the pot"
- Works perfectly with play money / points

**Basic math:**
```
Total pot = sum of all bets
Winner pool = sum of bets on winning outcome
Your payout = (your bet / winner pool) × total pot
```

**Example:**
- Total pot: 100 coins
- Bets on "Happy tears": 60 coins (3 people: 20, 20, 20)
- Bets on "Stunned silence": 30 coins (2 people: 15, 15)  
- Bets on "Screams": 10 coins (1 person: 10)

If "Stunned silence" wins:
- Each person who bet 15 coins gets: (15/30) × 100 = 50 coins
- 3.3x return on their bet

---

## User Flow (v1)

### 1. Create a Bet

**Creator provides:**
- Question/scenario (e.g., "How will mom react to the pregnancy news?")
- 3-6 outcome options (can start from template)
- Wild card option auto-included ("Something else entirely")
- Deadline for betting (when does the event happen?)

**Templates available for common scenarios:**
- Reaction to big news
- Speech/toast duration
- Who arrives first/last
- Will X happen during Y event

### 2. Share with Group

- Creator shares link/code with friends
- Friends join the bet pool

### 3. Predict & Stake

Each participant:
- **Picks an outcome** (their prediction)
- **Stakes coins** (their confidence level)

Confidence is expressed through stake size, not probability sliders. More coins = more confident.

### 4. Reveal Predictions (Pre-Event Social Moment)

Before the event happens, show everyone what the group predicted:
- Distribution of picks across outcomes
- This creates anticipation and discussion
- Implicit odds visible: "6 people picked happy tears, only 1 picked screams"

### 5. Event Happens

The real-world moment occurs. Everyone watches/waits.

### 6. Resolution

**Creator decides the outcome.** 
- Simple and fast
- If disputed, group can flag for review (v2 feature: arbitration)

### 7. Payouts & Bragging Rights

- Winners receive their share of the pot
- "Called It!" shareable moment/card for winners
- Leaderboard updates (streak tracking, lifetime accuracy)

---

## Key Design Decisions

### No Probability Sliders

Early exploration considered having creators or users set probability estimates. **Rejected because:**
- These are one-time human moments with no historical data
- Asking "how likely is your mom to cry?" feels clinical and weird
- No one has real information—that's the whole point

**Instead:** Let betting behavior reveal implicit odds. Pick + stake = your prediction.

### Light Touch Priors (Optional, Mostly for Over/Under Bets)

For continuous outcomes (speech length, timing), creator can set a center point:
- "What's your guess for speech length?" → Creator types "5 minutes"
- App auto-generates brackets: Under 3 min / 3-5 min / 5-7 min / 7+ min

For reaction/outcome bets, no priors needed—equal starting odds, market shapes itself.

### Option Limits

**3-6 options per bet** (enforced)
- Fewer than 3: Too binary, not interesting
- More than 6: Decision fatigue, diluted stakes

**Wild card always included:**
- "Something else entirely" cannot be deleted
- Covers unexpected outcomes
- Clean resolution path for surprises

### Play Money / Points Economy

v1 uses points/coins, not real money:
- Removes legal/regulatory complexity
- Keeps it fun, not stressful
- Streaks and leaderboards provide social motivation

---

## Data Model (Conceptual)

### Bet
```
id: string
creator_id: string
question: string
options: Option[]
status: 'open' | 'locked' | 'resolved'
resolution_deadline: timestamp
winning_option_id: string | null
created_at: timestamp
```

### Option
```
id: string
bet_id: string
label: string
is_wild_card: boolean
```

### Wager
```
id: string
bet_id: string
user_id: string
option_id: string
amount: number (coins staked)
created_at: timestamp
```

### User
```
id: string
display_name: string
balance: number (coin balance)
created_at: timestamp
```

### Payout (calculated at resolution)
```
user_id: string
bet_id: string
amount_won: number
```

---

## Payout Calculation Logic

```javascript
function calculatePayouts(bet, winningOptionId) {
  const allWagers = getWagersForBet(bet.id);
  const totalPot = allWagers.reduce((sum, w) => sum + w.amount, 0);
  
  const winningWagers = allWagers.filter(w => w.option_id === winningOptionId);
  const winnerPool = winningWagers.reduce((sum, w) => sum + w.amount, 0);
  
  if (winnerPool === 0) {
    // No one picked the winner — house keeps pot or refund?
    // Decision: Refund all bets (keeps it friendly)
    return allWagers.map(w => ({ user_id: w.user_id, amount: w.amount }));
  }
  
  return winningWagers.map(w => ({
    user_id: w.user_id,
    amount_won: (w.amount / winnerPool) * totalPot
  }));
}
```

---

## Future Features (Out of Scope for v1)

- **Combo/stacked predictions:** Pick multiple outcomes that happen in sequence (e.g., "cries THEN screams")
- **Group arbitration:** Voting mechanism for disputed resolutions
- **Bet chains:** Series of related predictions for an event (wedding day mega-pool)
- **Real money integration:** Legal complexity, save for later
- **Public/discoverable bets:** v1 is private groups only
- **Video integration:** Clip the moment, attach to resolution

---

## Technical Recommendations for Prototype

### Stack Suggestions
- **Frontend:** React Native (cross-platform mobile) or Next.js (web-first MVP)
- **Backend:** Supabase (fast to prototype, handles auth + real-time) or Firebase
- **Real-time updates:** Important for the "reveal predictions" moment and live odds

### Key Screens (v1)
1. **Home:** Active bets, past bets, create new
2. **Create Bet:** Question, options (template or custom), deadline
3. **Bet Detail (Open):** See options, place your wager
4. **Bet Detail (Locked):** See group predictions, await outcome
5. **Bet Detail (Resolved):** Winner, payouts, "Called It!" moment
6. **Profile:** Balance, streak, history

### Edge Cases to Handle
- No one bets on the winning outcome (refund all)
- Creator forgets to resolve (reminder notifications, auto-expire?)
- Tie scenarios (if applicable to bet type)
- User tries to bet more coins than they have
- User tries to change bet after placing (allow until betting locks?)

---

## Open Questions for Prototype Phase

1. **Initial coin balance:** How many coins do new users start with?
2. **Coin replenishment:** Daily allowance? Earn through participation?
3. **Can creator bet?** Potential conflict of interest since they resolve
4. **Bet editing:** Can creator modify options after sharing but before anyone bets?
5. **Private vs. link-sharing:** Require accounts for all participants or allow anonymous betting via link?

---

## Summary

**Called It!** is a social prediction game where:
- Someone creates a question about an upcoming moment
- Friends pick outcomes and stake coins
- Everyone sees the group's predictions before the moment
- Reality unfolds, creator resolves, winners split the pot
- Bragging rights ensue

The math is simple parimutuel pooling. The magic is in the social anticipation and the "called it!" payoff.
