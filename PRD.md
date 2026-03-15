# Called It! — Product Requirements Document

**Version:** 0.1 (Prototype)
**Last Updated:** 2026-03-13
**Status:** Draft

---

## 1. Product Vision

**Called It!** is a social prediction game for life's micro-moments. Friends create playful wagers on real-world events — reactions, timing, who does what — stake play-money coins, and compete for bragging rights.

**One-liner:** "Predict the unpredictable with your friends."

### 1.1 Design Principles

1. **Fun first, mechanics second.** Every design decision should amplify social fun. If a feature feels like a spreadsheet, cut it.
2. **Low friction, high anticipation.** Creating and joining a bet should take under 30 seconds. The wait before the moment should feel electric.
3. **Friendly stakes.** Play money only. Losing coins should sting just enough to care, never enough to cause real conflict.
4. **Moments over markets.** This is not a prediction market. There are no efficient markets here — just friends who think they know each other.

### 1.2 Success Metrics (Prototype Phase)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Bet completion rate | >70% of created bets reach resolution | Core loop works |
| Group size per bet | Avg 4+ participants | Social dynamics are alive |
| Time to first bet (new user) | <2 minutes from signup | Onboarding isn't blocking fun |
| Return rate | >40% of users create/join a 2nd bet within 7 days | Retention signal |
| Share rate | >30% of resolved bets generate a "Called It!" share | Viral loop is working |

---

## 2. Target Audience

### 2.1 Primary Persona: "The Group Chat Instigator"

- **Age:** 22–35
- **Behavior:** Already makes casual predictions in group chats ("I bet she cries," "No way he's on time"). Loves being right and letting everyone know.
- **Motivation:** Social currency — being the one who called it.
- **Context:** Weddings, baby showers, family dinners, watch parties, friend group trips.

### 2.2 Secondary Persona: "The Along-for-the-Ride Friend"

- **Behavior:** Joins because they were sent a link. Not the instigator, but competitive once involved.
- **Motivation:** FOMO and not wanting to miss out on the group activity.
- **Key need:** Joining must be dead simple — no account wall for viewing, minimal friction to participate.

### 2.3 Use Case Scenarios

| Scenario | Example |
|----------|---------|
| Big news reaction | "How will Dad react when we tell him about the baby?" |
| Event timing | "How long will the best man speech be?" |
| Social behavior | "Who will be the last person to arrive at the party?" |
| Outcome prediction | "Will it rain during the outdoor ceremony?" |
| Pop culture | "Will Jake propose during the trip?" |

---

## 3. Coin Economy

### 3.1 Starting Balance

New users receive **500 coins** on signup. Enough to participate in ~5-10 bets at moderate stakes without feeling broke immediately.

### 3.2 Replenishment

| Source | Amount | Frequency |
|--------|--------|-----------|
| Daily login bonus | 25 coins | Once per day |
| Creating a bet (that gets 3+ participants) | 50 coins | Per qualifying bet |
| Streak bonus (3+ correct in a row) | 100 coins | On streak milestone |
| Participation bonus (placing any wager) | 10 coins | Per bet joined |
| Invite bonus (friend joins via your link) | 50 coins | Per new user |

### 3.3 Minimum / Maximum Stakes

- **Minimum wager:** 10 coins (ensures skin in the game)
- **Maximum wager:** 200 coins per bet (prevents one person dominating the pool)
- **Broke protection:** If balance < 10 coins, user receives a one-time "bailout" of 100 coins (once per week max)

### 3.4 Economy Philosophy

Coins should feel abundant enough that people bet freely, but scarce enough that a big win feels meaningful. The economy is inflationary by design — that's fine. Leaderboards and streaks provide the real status, not raw coin count.

---

## 4. Feature Requirements (v1 Prototype)

### 4.1 Authentication & Onboarding

**Auth method:** Phone number + OTP (fastest path to identity without passwords).
Fallback: "Sign in with Apple / Google" for users who prefer it.

**Onboarding flow:**

1. **Welcome screen** — App name, one-line pitch, "Get Started" CTA
2. **Sign in** — Phone number or social auth
3. **Set display name + avatar** — Name required, avatar optional (auto-generate initial)
4. **Tutorial bet** — Optional interactive walkthrough: "Let's make your first prediction" using a sample scenario. Skip-able.
5. **Home screen** — Empty state with strong CTA: "Create Your First Bet" or "Join with a code"

**Key decisions:**
- No email required at signup
- Display names do not need to be unique (users are identified by phone/auth ID)
- Profile photo upload available but not required

---

### 4.2 Home Screen

**Sections (top to bottom):**

1. **Active Bets** — Bets you're involved in that are open or locked (sorted by deadline, soonest first)
2. **Needs Resolution** — Bets you created that are past deadline and need resolving (creator only, badged)
3. **Recent Results** — Resolved bets from the last 7 days (most recent first)
4. **Quick Actions:**
   - "Create a Bet" (primary CTA, always visible)
   - "Join with Code" (secondary)

**Empty state:** Illustration + "No bets yet. Start one or join a friend's!" with both CTAs.

**Navigation (bottom tab bar):**
- Home (feed)
- Leaderboard
- Create (+) — center, prominent
- Activity (notifications)
- Profile

---

### 4.3 Create a Bet

**Step 1: Question**
- Text input: "What are you predicting?" (max 150 chars)
- Template picker below input (horizontal scroll of category cards)
  - Each template pre-fills the question and suggested options
  - Templates: Reaction, Timing/Duration, Who Will..., Will X Happen?, Custom

**Step 2: Outcomes**
- 2-5 custom options (creator adds/removes)
- Wild card ("Something else entirely") auto-appended, non-removable
- Total options displayed: 3-6 including wild card
- Each option: text input, max 60 chars
- Drag to reorder

**Step 3: Deadline**
- "When does this happen?" — date + time picker
- Quick presets: "In 1 hour," "Today," "Tomorrow," "This weekend," "Pick a date"
- Betting locks at this time (no more wagers accepted)
- Minimum deadline: 5 minutes from now
- Maximum deadline: 30 days from now

**Step 4: Review & Share**
- Preview card showing question, options, deadline
- "Create & Share" button
- On creation: auto-generate a share link + 6-digit join code
- Share sheet: native OS share (iMessage, WhatsApp, copy link, etc.)

**Constraints:**
- Creator CAN bet on their own question (see 4.6 Resolution for conflict mitigation)
- Creator CAN edit question and options ONLY if zero wagers have been placed
- Once any wager exists, question and options are locked

---

### 4.4 Join a Bet

**Entry points:**
1. Deep link (tapped from share)
2. Join code (entered manually on home screen)

**Join flow:**
- If not signed in: prompt signup first, then redirect to bet
- If signed in: land directly on bet detail screen
- No approval needed from creator — anyone with the link/code can join

---

### 4.5 Bet Detail & Wagering

**States and what's shown:**

#### Open (accepting wagers)
- Question prominently displayed
- List of outcome options with current pool distribution (shown as % bars after user has placed their own wager — hidden before to avoid anchoring)
- Wager input: pick an outcome, set coin amount (slider + manual input)
- Countdown to deadline
- Participant count ("12 people are in")
- "Place Your Bet" CTA
- After placing: confirmation + option to change until deadline

#### Locked (deadline passed, awaiting resolution)
- "Predictions are in!" header
- Full reveal: show all predictions — who picked what, total coins per outcome, implied odds
- Participant avatars grouped by outcome
- Countdown or prompt to creator: "Waiting for [Creator] to call it"
- No more wagers allowed

#### Resolved
- Winning outcome highlighted
- Payout breakdown: who won, how much
- "Called It!" badge on winners
- Shareable result card (see 4.8)
- Link back to leaderboard impact

**Bet modification:**
- Users CAN change their pick and stake amount any time before deadline
- Changing replaces the previous wager entirely (no partial edits)
- Users CAN withdraw their bet entirely before deadline (coins returned)

---

### 4.6 Resolution

**Who resolves:** The bet creator.

**Flow:**
1. After deadline passes, creator sees a "Resolve This Bet" prompt (home screen badge + push notification)
2. Creator taps into the bet, selects the winning outcome
3. Confirmation screen: "Are you sure? [Outcome] wins. This can't be undone."
4. On confirm: payouts calculated and distributed instantly

**Conflict mitigation (creator betting on own bet):**
- Creator's wager is visible to all participants during the locked phase
- If creator picks the outcome they bet on, a subtle note appears: "[Creator] also bet on this outcome"
- v1 relies on social trust. v2 can add group dispute/arbitration.

**Expiration:**
- If creator doesn't resolve within 48 hours of deadline: reminder push at 24h and 48h
- At 72 hours: all wagers refunded, bet marked as "Expired"
- Creator loses 50 coins as a penalty for abandoning

**Edge cases:**
- **No one picked the winner:** All wagers refunded (as in spec)
- **Only one person bet on the winner:** They get the entire pot
- **Tie (inapplicable to most bets):** If creator marks a "tie" outcome (v2), split among all who picked any tied outcome

---

### 4.7 Leaderboard

**Scope:** Global (all users) and per-group (friends you've bet with).

**Leaderboard metrics:**

| Stat | Description |
|------|-------------|
| Accuracy | % of bets where user picked the winning outcome |
| Profit | Net coins won minus coins wagered (lifetime) |
| Streak | Current consecutive correct predictions |
| Best streak | All-time longest streak |
| Bets joined | Total participation count |

**Default sort:** Profit (lifetime). Toggle to Accuracy or Streak.

**Time filters:** All time, This month, This week.

**Social hooks:**
- "You're ranked #3 among friends" nudge on home screen
- Streak badge visible on profile and in bet participant lists

---

### 4.8 "Called It!" Shareable Moment

When a user wins a bet, they can generate a **shareable card**:

**Card contents:**
- Question text
- Winning outcome (highlighted)
- User's prediction + stake
- Payout amount
- "Called It!" branding
- Optional: group stats ("Only 2 out of 9 people got this right")

**Format:** Image (for iMessage/Instagram stories/etc.) and link (opens bet in app).

**Auto-generation:** Card is created on resolution. Winner gets a push notification: "You called it! Share your win."

---

### 4.9 Notifications

| Trigger | Recipient | Message | Timing |
|---------|-----------|---------|--------|
| Invited to bet | Invitee | "[Creator] wants your prediction: [Question]" | On share |
| Deadline approaching | All participants who haven't bet | "Last chance! [Question] closes in 1 hour" | 1 hour before deadline |
| Betting closed | All participants | "Predictions are locked for [Question]. See what everyone thinks!" | At deadline |
| Resolve reminder | Creator | "Time to call it! Who won [Question]?" | 1h, 24h, 48h after deadline |
| Bet resolved — you won | Winners | "You called it! [Outcome] wins. You earned [X] coins" | On resolution |
| Bet resolved — you lost | Losers | "[Outcome] wins [Question]. Better luck next time!" | On resolution |
| Streak milestone | User | "You're on a [X]-bet streak!" | On qualifying resolution |
| Daily bonus available | User | "Your daily coins are waiting" | Daily, if not already claimed |

**Notification preferences:** Users can mute per-bet or globally (in settings).

---

### 4.10 Profile

**Visible to self:**
- Display name + avatar
- Coin balance
- Stats: accuracy %, total bets, current streak, best streak, net profit
- Bet history (list of past bets with outcomes)
- Settings (notifications, account, sign out)

**Visible to others (in bet context):**
- Display name + avatar
- Accuracy % and current streak (shown as badges in participant lists)

---

## 5. Information Architecture

```
App
├── Home
│   ├── Active Bets (list)
│   ├── Needs Resolution (creator only)
│   ├── Recent Results (list)
│   └── Quick Actions (Create / Join)
│
├── Create Bet (flow)
│   ├── Step 1: Question + Template
│   ├── Step 2: Outcomes
│   ├── Step 3: Deadline
│   └── Step 4: Review & Share
│
├── Bet Detail
│   ├── Open State (wager UI)
│   ├── Locked State (prediction reveal)
│   └── Resolved State (results + share)
│
├── Leaderboard
│   ├── Global
│   └── Friends
│
├── Activity (notifications)
│
└── Profile
    ├── Stats
    ├── Bet History
    └── Settings
```

---

## 6. Technical Architecture (Prototype)

### 6.1 Recommended Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | **React Native (Expo)** | Cross-platform mobile from day one. Expo for fast iteration. |
| Backend | **Supabase** | Auth, Postgres DB, real-time subscriptions, edge functions — all in one. |
| Real-time | **Supabase Realtime** | Live updates for bet pools, prediction reveals, resolution. |
| Notifications | **Expo Push + Supabase Edge Functions** | Scheduled triggers for reminders, instant for resolution events. |
| Share cards | **Server-side image generation** (e.g., Satori/og-image) | Generate "Called It!" cards as images for social sharing. |
| Deep linking | **Expo Linking + universal links** | Bet join links open directly in app (or app store if not installed). |

### 6.2 Database Schema (Supabase/Postgres)

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  display_name text not null,
  avatar_url text,
  coin_balance integer not null default 500,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  created_at timestamptz not null default now()
);

-- Bets
create table bets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references users(id),
  question text not null,
  status text not null default 'open' check (status in ('open', 'locked', 'resolved', 'expired')),
  deadline timestamptz not null,
  winning_option_id uuid references options(id),
  join_code text unique not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Options
create table options (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  label text not null,
  is_wild_card boolean not null default false,
  sort_order integer not null default 0
);

-- Wagers
create table wagers (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id),
  user_id uuid not null references users(id),
  option_id uuid not null references options(id),
  amount integer not null check (amount >= 10 and amount <= 200),
  created_at timestamptz not null default now(),
  unique (bet_id, user_id)  -- one wager per user per bet
);

-- Payouts (written on resolution)
create table payouts (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id),
  user_id uuid not null references users(id),
  amount integer not null,
  created_at timestamptz not null default now()
);

-- Bet participants (tracks who joined, even if they haven't wagered yet)
create table bet_participants (
  bet_id uuid not null references bets(id),
  user_id uuid not null references users(id),
  joined_at timestamptz not null default now(),
  primary key (bet_id, user_id)
);
```

### 6.3 Key Real-Time Subscriptions

- `wagers` table (bet detail screen — live pool updates while bet is open)
- `bets` table (status changes: open → locked → resolved)
- `payouts` table (resolution moment — show winnings appear)

### 6.4 Edge Functions (Server-Side Logic)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `lock-bet` | Cron (every minute) | Lock bets whose deadline has passed |
| `resolve-bet` | API call from creator | Validate, calculate payouts, distribute coins |
| `expire-bet` | Cron (every hour) | Expire unresolved bets after 72h, refund wagers |
| `daily-bonus` | Cron (daily) | Credit daily login bonus to eligible users |
| `send-reminders` | Cron (every 15 min) | Push notifications for approaching deadlines, unresolved bets |
| `generate-share-card` | On resolution | Render "Called It!" image card |

---

## 7. Prototype Scope

### 7.1 In Scope (Build This)

- User auth (phone OTP or social sign-in)
- Create bet flow (question, outcomes, deadline, share)
- Join via link or code
- Place, modify, and withdraw wagers
- Real-time pool updates
- Betting lock at deadline
- Creator resolution flow
- Payout calculation and distribution
- Prediction reveal (locked state)
- Resolved state with winner highlight
- Basic leaderboard (profit + accuracy)
- Push notifications (core set from 4.9)
- "Called It!" share card generation
- Profile with stats and history
- Coin economy (starting balance, daily bonus, participation bonus)

### 7.2 Out of Scope (v2+)

- Group/dispute arbitration
- Combo/stacked predictions
- Bet chains (event mega-pools)
- Real money
- Public/discoverable bets
- Video clip attachment
- Rich social features (comments, reactions on bets)
- In-app chat
- Achievement/badge system beyond streaks
- Dark mode (nice to have but not prototype-blocking)

---

## 8. Open Questions — Proposed Answers

| # | Question | Proposed Answer | Rationale |
|---|----------|-----------------|-----------|
| 1 | Initial coin balance? | 500 coins | ~10 moderate bets worth. Generous enough to explore, scarce enough to care. |
| 2 | Coin replenishment? | Daily bonus (25) + participation rewards (see 3.2) | Keeps users coming back without making coins meaningless. |
| 3 | Can creator bet? | Yes | Social trust model. Creator's bet is visible to all once locked. Social pressure prevents abuse in friend groups. |
| 4 | Bet editing after share? | Only if zero wagers placed | Once someone has bet, the terms are set. Prevents bait-and-switch. |
| 5 | Anonymous betting via link? | No — account required to wager | Identity is core to social dynamics. Viewing a bet can be anonymous; participating cannot. |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Creators don't resolve bets | High | Breaks core loop | Auto-expire at 72h with refund + creator penalty. Aggressive reminders. |
| Small groups → lopsided pools | Medium | Less fun if everyone picks the same thing | Wild card option helps. Show prediction reveal to build drama even with consensus. |
| Coin economy too inflationary | Medium | Coins lose meaning | Cap max wager at 200. Monitor and tune replenishment rates. |
| Low retention after first bet | High | Growth stalls | Push notifications for new bets from friends. "Invite bonus" coins. Streak mechanics. |
| Creator abuse (resolving in own favor) | Low | Trust erosion | Transparency (creator's bet visible). Social pressure in friend groups. v2: arbitration. |
| Sharing friction (nobody clicks the link) | Medium | Bets don't get participants | Rich link previews (OG tags). Join code as fallback. In-app contact list invite. |

---

## 10. Design Direction (Non-Prescriptive)

### 10.1 Tone & Voice

- Playful, not snarky
- Confident, not aggressive
- Celebratory when winning, encouraging when losing
- Copy should feel like a fun friend, not a casino

**Example copy:**
- Bet creation: "What's your bold prediction?"
- Wagering: "Put your coins where your mouth is"
- Lock: "Predictions are sealed. No take-backs!"
- Win: "YOU CALLED IT! Collect your coins."
- Loss: "Not this time. But your comeback starts now."

### 10.2 Visual Direction

- Bright, high-energy palette (think confetti, not Wall Street)
- Card-based UI for bets
- Generous use of motion — coin animations on payouts, confetti on wins
- Avatars and social proof prominent throughout
- Dark UI with bright accents could work well (evening/event context)

---

## Appendix A: Payout Logic (Reference)

```javascript
function calculatePayouts(betId, winningOptionId) {
  const allWagers = getWagersForBet(betId);
  const totalPot = allWagers.reduce((sum, w) => sum + w.amount, 0);

  const winningWagers = allWagers.filter(
    w => w.option_id === winningOptionId
  );
  const winnerPool = winningWagers.reduce((sum, w) => sum + w.amount, 0);

  // Edge case: no one picked the winner — refund everyone
  if (winnerPool === 0) {
    return allWagers.map(w => ({
      user_id: w.user_id,
      amount: w.amount,
      type: 'refund'
    }));
  }

  // Standard payout: winners split pot proportionally
  return winningWagers.map(w => ({
    user_id: w.user_id,
    amount_won: Math.floor((w.amount / winnerPool) * totalPot),
    type: 'win'
  }));
}
```

**Note:** `Math.floor` may leave a few coins unallocated due to rounding. Remainder coins go to the highest-stake winner (tie-break: earliest wager).

---

## Appendix B: Template Library (v1)

| Template | Pre-filled Question | Suggested Outcomes |
|----------|--------------------|--------------------|
| Reaction | "How will [person] react to [news]?" | Happy tears, Stunned silence, Screams, Plays it cool |
| Speech Duration | "How long will [person]'s speech be?" | Under 3 min, 3-5 min, 5-10 min, 10+ min |
| Who Will... | "Who will be the [first/last] to [action]?" | [Editable name fields] |
| Yes/No/Twist | "Will [thing] happen at [event]?" | Definitely yes, No way, Yes but with a twist |
| Over/Under | "How many [things] at [event]?" | Under [X], Exactly [X], Over [X] |
