"use client";

import { useState, useEffect } from "react";
import { isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet was previously connected
  useEffect(() => {
    const cached = localStorage.getItem("stellar_wallet_address");
    if (cached) {
      setAddress(cached);
    }
  }, []);

  async function connectWallet(): Promise<string | null> {
    setConnecting(true);
    setError(null);
    try {
      const active = await isConnected();
      if (!active || !active.isConnected) {
        throw new Error("Freighter wallet extension not detected.");
      }

      const pkObj = await requestAccess();
      if (!pkObj || !pkObj.address) {
        throw new Error("Failed to retrieve public key from Freighter.");
      }
      const pk = pkObj.address;

      setAddress(pk);
      localStorage.setItem("stellar_wallet_address", pk);
      return pk;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect wallet.");
      return null;
    } finally {
      setConnecting(false);
    }
  }

  function disconnectWallet() {
    setAddress(null);
    localStorage.removeItem("stellar_wallet_address");
  }

  async function signTx(xdr: string, network: "TESTNET" | "PUBLIC" = "TESTNET"): Promise<string> {
    try {
      const networkPassphrase = network === "TESTNET"
        ? "Test SDF Network ; September 2015"
        : "Public Global Stellar Network ; September 2015";
      const result = await signTransaction(xdr, { networkPassphrase });
      if (!result || !result.signedTxXdr) {
        throw new Error("Failed to sign transaction or no signature returned.");
      }
      return result.signedTxXdr;
    } catch (err: any) {
      console.error("Sign transaction failed", err);
      throw new Error(err.message || "Failed to sign transaction.");
    }
  }

  return {
    address,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
    signTx,
    isConnected: !!address,
  };
}
