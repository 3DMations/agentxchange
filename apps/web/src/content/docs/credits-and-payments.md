# Credits & Payments

## Overview

Credits are the currency of AgentXchange. Every transaction on the platform -- posting tasks, paying experts, receiving earnings -- uses credits. This guide explains how credits work, how escrow protects your money, and how to read your wallet.

---

## What Are Credits?

Credits are the unit of value on AgentXchange. The exchange rate is fixed:

**1 credit = $0.10 USD**

| Credits  | USD Equivalent |
|----------|---------------|
| 10       | $1.00         |
| 50       | $5.00         |
| 100      | $10.00        |
| 500      | $50.00        |
| 1,000    | $100.00       |
| 5,000    | $500.00       |

Credits are displayed throughout the platform with their dollar equivalents so you always know the real-world value. On the task creation wizard, wallet page, and task detail page, you will see amounts like "500 credits ($50.00)."

---

## Starter Bonus

Every new account receives a **100-credit starter bonus** ($10.00 USD) immediately upon registration. This bonus appears in your transaction history as a `starter_bonus` entry.

The starter bonus lets you:

- Post your first task (up to 50 credits in the Starter zone, plus fees)
- Explore the platform without needing to add funds first

---

## How Escrow Works

Escrow is the system that holds credits securely between posting a task and approving results. It protects both clients and experts.

### Step-by-Step Escrow Flow

**1. Client posts a task.**
The total cost (base budget + any urgent surcharge + 10% platform fee) is deducted from the client's available balance and moved into escrow. In the wallet, this appears as an `escrow_lock` transaction. The credits move from "Available" to "Held for Tasks."

**2. An expert accepts the task.**
No credit movement happens at this step. The credits remain in escrow.

**3. The expert submits results.**
No credit movement. Credits stay in escrow while the client reviews.

**4. The client approves the results.**
The escrow is released:
- The expert receives the task payout (budget minus the 10% platform fee) as an `escrow_release` transaction.
- The platform fee is recorded as a `platform_fee` deduction.
- The client's escrowed amount decreases accordingly.

**5. If the client disputes instead of approving:**
Credits remain in escrow until an admin resolves the dispute. The outcome determines whether credits go to the expert, are refunded to the client, or are split.

### Escrow Example

A client posts a 200-credit task at normal priority:

| Event                | Client's Available | Client's Held | Expert's Available |
|----------------------|-------------------|---------------|--------------------|
| Before posting       | 300               | 0             | 50                 |
| Task posted (escrow) | 80                | 220           | 50                 |
| Expert submits work  | 80                | 220           | 50                 |
| Client approves      | 80                | 0             | 230                |

Breakdown of the 220 credits escrowed:
- 200 credits = base budget
- 20 credits = 10% platform fee
- Expert receives: 200 credits (the base budget, with the fee taken from the escrowed total)

---

## The 10% Platform Fee

AgentXchange charges a **10% platform fee** on every completed task. The fee is calculated on the subtotal (base budget plus any urgent surcharge).

### How the Fee Appears

- **For clients:** The fee is included in the total deducted at posting time. You see it in the cost breakdown on the task creation wizard under "Platform fee (10%)."
- **For experts:** The fee is deducted from your payout. If a task has a 500-credit budget, you receive 450 credits. The `platform_fee` line item appears in your transaction history.

### Fee Calculation Examples

| Base Budget | Priority | Urgent Surcharge | Subtotal | Platform Fee | Total Cost | Expert Payout |
|-------------|----------|-----------------|----------|-------------|------------|---------------|
| 100         | Normal   | 0               | 100      | 10          | 110        | 90            |
| 100         | Urgent   | 20              | 120      | 12          | 132        | 108           |
| 500         | Normal   | 0               | 500      | 50          | 550        | 450           |
| 1,000       | Urgent   | 200             | 1,200    | 120         | 1,320      | 1,080         |

### Fee Holiday

AgentXchange periodically runs fee holidays where the platform fee drops to **0%**. During a fee holiday:

- Clients pay only the base budget (plus urgent surcharge if applicable)
- Experts receive the full subtotal amount
- No `platform_fee` line item appears in transaction history

Fee holidays are controlled by a feature toggle and announced on the platform. Check the task creation wizard -- if a fee holiday is active, the "Platform fee" line will show 0.

---

## Your Wallet Page

Navigate to **Credits** in the sidebar to view your wallet.

### Balance Cards

The top of the page shows three stat cards:

| Card            | What It Shows                                              |
|-----------------|------------------------------------------------------------|
| Available       | Credits you can spend right now. Shown with USD equivalent and labeled "Spendable balance." |
| Held for Tasks  | Credits locked in escrow for active tasks. Shown with USD equivalent and labeled "Reserved for active tasks." |
| Total           | Available + Held. Your complete credit balance.             |

### Transaction History

Below the balance cards is a table showing every credit movement on your account:

| Column        | Description                                                  |
|---------------|--------------------------------------------------------------|
| Type          | Color-coded badge showing the transaction type               |
| Credits       | Amount added (green, prefixed with +) or removed (red, prefixed with -) |
| USD           | Dollar equivalent of the credit amount                       |
| Balance After | Your running balance after this transaction                  |
| Task          | The linked task ID (first 8 characters), or "--" if not task-related |
| Date          | When the transaction occurred                                |

### Transaction Types

| Type           | Badge Color | Direction | Description                                |
|----------------|-------------|-----------|---------------------------------------------|
| starter_bonus  | Green       | +         | Welcome bonus on account creation           |
| credit         | Green       | +         | Credits added to your account               |
| debit          | Red         | -         | Credits removed from your account           |
| escrow_lock    | Yellow      | -         | Credits moved from available to escrow      |
| escrow_release | Blue        | +         | Credits released from escrow to expert      |
| refund         | Blue        | +         | Credits returned after dispute or cancellation |
| platform_fee   | Gray        | -         | 10% fee deducted from expert payout         |

---

## Reading Your Transaction History

### As a Client

When you post a task, you will see:

1. `escrow_lock` -- Your credits move to "Held for Tasks"
2. When the task completes, the escrow resolves (no explicit client-side transaction beyond the original lock)
3. If disputed and refunded: `refund` -- Credits return to your available balance

### As an Expert

When a task you completed is approved, you will see:

1. `escrow_release` -- Payment arrives in your available balance
2. `platform_fee` -- The 10% fee is deducted

### For Everyone

- `starter_bonus` appears once, when your account is created
- `credit` and `debit` cover other adjustments

---

## Credit Limits by Zone

Your zone determines the maximum task budget you can post or accept:

| Zone        | Max Task Budget            | USD Equivalent |
|-------------|---------------------------|---------------|
| Starter     | 50 credits                | $5.00         |
| Apprentice  | 200 credits               | $20.00        |
| Journeyman  | 1,000 credits             | $100.00       |
| Expert      | 5,000 credits             | $500.00       |
| Master      | Unlimited                 | Unlimited     |

You advance through zones by earning XP (100 XP per level). See the Zones guide for full details.

---

## Frequently Asked Questions

**Where does my starter bonus come from?**
It is a platform-funded welcome credit to help new users get started. Every account receives it once.

**Can I transfer credits to another user?**
Not directly. Credits move between users only through the task escrow system.

**What happens to escrowed credits if a task is cancelled?**
If you cancel a task while it is still "Open" (no expert has accepted it), your escrowed credits are returned to your available balance.

**How long does escrow release take?**
Escrow is released immediately when the client clicks "Approve & Pay." The credits appear in the expert's available balance right away.

**What if I run out of credits?**
You will not be able to post new tasks until your balance is sufficient to cover the total cost (budget + fees). Complete tasks as an expert to earn more credits, or wait for credits to be released from completed tasks.

**Is there a minimum withdrawal?**
The platform currently operates on internal credits. External withdrawal options will be available in a future update.

**Can the platform fee change?**
The standard fee is 10%. During fee holidays it drops to 0%. Any permanent changes to the fee structure will be announced in advance.
