# 🌐 Twirvo: The On-Chain Social Ledger

Twirvo is a high-fidelity decentralized social protocol engineered on the **Solana Blockchain**. By leveraging the native **SPL Memo Program**, Twirvo etches permanent, censorship-resistant social interactions directly into the global ledger, transforming a blockchain into a living social history.

> 📺 **Demo:** [Watch the Video Here](https://www.youtube.com/watch?v=R7-WEDY-dDc)

---

## 🚀 Core Features

* **⛓️ Immutable Ledger**: Every interaction is a verified transaction on the Solana blockchain, ensuring a permanent and tamper-proof history.
* **🏛️ Sovereign Communities**: Users can found independent digital communities with customizable branding, unique settings, and sovereign feeds.
* **💎 Creator Economy**: Community founders are economically aligned with their platform, receiving a **50% revenue share** of the protocol fee for every action taken within their community walls.
* **📜 Fully Auditable History**: Every community maintains a complete on-chain commit log of every edit made to its profile or branding, ensuring total transparency.
* **🏆 Reputation Engine**: A persistent point system awards points for contributing posts, votes, comments, and network ties.
* **🔍 Forensic Auditing**: Traverse any record back to its source transaction to verify data integrity and the complete ancestry of all posts and child comments.
* **🛡️ Content Safety**: Robust server-side profanity filtering combined with local blocklists for user-controlled safety.

---

## 🛠️ Technical Architecture

Twirvo utilizes a **Next.js** frontend integrated with a custom **indexing engine** that decrypts blockchain data into a usable social state.

### **The Ledger Engine (`useTwirvoLedger.ts`)**
This is the heart of the protocol. It handles the real-time synchronization between the Solana blockchain and your browser.

| Function | Purpose |
| :--- | :--- |
| `fetchTwirvosFromLedger` | Orchestrates the primary sync, pulling signatures and decoding memo data. |
| `getCommStats` | Aggregates community data including members, post activity, and founder revenue. |
| `isTargetDeleted` | A recursive check verifying if a post or its parent ancestry has been marked for removal. |
| `addPts` | The core "Bagwork" engine that assigns points for posts, comments, and network ties. |

### **The Interaction Layer (`TwirvoContext.tsx`)**
Handles the construction and broadcasting of on-chain transactions.

* **`pushAction`**: The primary method for sending data to the chain. It dynamically calculates fees—**0.0001 SOL** for standard actions and **0.1 SOL** for community-heavy operations.
* **`PROTOCOL_WHITELIST`**: A specialized bouncer system allowing designated users to bypass protocol fees and tips for onboarding.
* **`isParentDeleted`**: Ensures the UI remains clean by hiding orphaned comments if the original post was removed.

---

## 💎 Points System

Twirvo rewards active participation through a synchronized point engine that matches the visual breakdown on user profiles.

### **Point Distribution Matrix**
* **🏛️ Found Community**: +50 Points.
* **📝 New Post**: +10 Points.
* **🚪 Join Community**: +10 Points.
* **💬 Comment**: +5 Points.
* **🤝 Network Tie**: +5 Points per Follower or Following.
* **🗳️ Voting**: +1 Point for Likes/Dislikes across posts, profiles, or communities.

---

## 🚥 Navigation & Sorting

The feed supports high-precision sorting, remembering your selection across sessions through the `useTwirvoPersistence` hook.

1.  **You**: View your personal contributions to the ledger.
2.  **Following**: A curated stream of explorers you trust.
3.  **Oldest**: The chronological genesis of the current view (Default).
4.  **Newest**: The most recent updates as they hit the chain.
5.  **Most Relevant**: Content scored based on your preferred keywords.
6.  **Most Liked**: The highest-rated entries in the current context.
7.  **Most Commented**: The most active discussions on the platform.

---

## 🚦 Getting Started

### **Environment Configuration**
To run Twirvo locally, ensure you have the following environment variables set:
* `ADMIN_API_KEY`: Required for pushing simulated posts to the local ledger.
* `SOLANA_RPC_URL`: A reliable endpoint.

### **Installation**
```bash
npm install
npm run dev
```

1. **Connect Wallet**: Ensure your wallet is set to the correct **Solana** network.
2. **Onboarding**: Whitelisted wallets automatically bypass all protocol and tip fees.
3. **Exploration**: Use the sidebar orbs to navigate the **Global Directory**, view Notifications, manage Settings, etc.

---

© 2026 Michael Yebba
All Rights Reserved. Registered Trademark: Twirvo.