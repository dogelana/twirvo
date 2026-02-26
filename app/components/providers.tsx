"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { PropsWithChildren } from "react";
import { autoDiscover, createClient } from "@solana/client";

// HARDCODE the Helius URL here to bypass the .env injection issue
const rpcUrl = "https://devnet.helius-rpc.com/?api-key=bac353a5-4f8f-41e5-94d6-015c520e6a81";

const client = createClient({
  endpoint: rpcUrl,
  walletConnectors: autoDiscover(),
});

export function Providers({ children }: PropsWithChildren) {
  return <SolanaProvider client={client}>{children}</SolanaProvider>;
}