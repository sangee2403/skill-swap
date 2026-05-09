/* eslint-disable no-undef */
// src/hooks/useBlockchain.js
import { useState, useCallback, useEffect } from "react";

const ABI = [
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "skillName", type: "string"  },
      { name: "sessionId", type: "string"  },
    ],
    name: "issueCredential",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user2",       type: "address" },
      { name: "skill1",      type: "string"  },
      { name: "skill2",      type: "string"  },
      { name: "duration",    type: "uint256" },
      { name: "dbSessionId", type: "string"  },
    ],
    name: "recordSession",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getCredentials",
    outputs: [{
      components: [
        { name: "id",        type: "uint256" },
        { name: "recipient", type: "address" },
        { name: "issuedBy",  type: "address" },
        { name: "skillName", type: "string"  },
        { name: "sessionId", type: "string"  },
        { name: "issuedAt",  type: "uint256" },
        { name: "valid",     type: "bool"    },
      ],
      type: "tuple[]",
    }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getSessions",
    outputs: [{
      components: [
        { name: "id",          type: "uint256" },
        { name: "user1",       type: "address" },
        { name: "user2",       type: "address" },
        { name: "skill1",      type: "string"  },
        { name: "skill2",      type: "string"  },
        { name: "duration",    type: "uint256" },
        { name: "completedAt", type: "uint256" },
        { name: "sessionId",   type: "string"  },
      ],
      type: "tuple[]",
    }],
    stateMutability: "view",
    type: "function",
  },
];

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";
const LOCAL_CHAIN_ID   = "0x7a69"; // 31337 Hardhat

// ── ENS fix: Hardhat network object ──────────────────────────────────────────
const HARDHAT_NETWORK = {
  chainId: 31337,
  name: "hardhat",
};

// ── Load ethers from npm ──────────────────────────────────────────────────────
let ethersLib = null;
async function getEthers() {
  if (ethersLib) return ethersLib;
  ethersLib = await import("ethers");
  return ethersLib;
}

export function useBlockchain() {
  const [wallet,  setWallet]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const hasMetaMask = () => typeof window.ethereum !== "undefined";

  // ── Auto check connection on mount ───────────────────────────────────────
  const checkConnection = useCallback(async () => {
    if (!hasMetaMask()) return;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) setWallet(accounts[0]);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    checkConnection();
    if (hasMetaMask()) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWallet(accounts[0] || null);
      });
    }
  }, []);

  // ── Connect wallet ────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!hasMetaMask()) {
      alert("MetaMask not found! Please install MetaMask extension.");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address  = accounts[0];

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LOCAL_CHAIN_ID }],
        });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId:         LOCAL_CHAIN_ID,
              chainName:       "Hardhat Local",
              nativeCurrency:  { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls:         ["http://127.0.0.1:8545"],
            }],
          });
        }
      }

      setWallet(address);
      return address;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Get contract instance — ENS FIX HERE ─────────────────────────────────
  const getContract = async (withSigner = true) => {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not set in .env");
    const { ethers } = await getEthers();

    if (!withSigner) {
      // Read-only — JsonRpcProvider with explicit network (ENS fix)
      const provider = new ethers.JsonRpcProvider(
        "http://127.0.0.1:8545",
        HARDHAT_NETWORK  // ← ENS fix: explicit network
      );
      return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    }

    // Switch to Hardhat Local before transaction
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: LOCAL_CHAIN_ID }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId:        LOCAL_CHAIN_ID,
            chainName:      "Hardhat Local",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls:        ["http://127.0.0.1:8545"],
          }],
        });
      }
    }

    // BrowserProvider with explicit network (ENS fix)
    const provider = new ethers.BrowserProvider(
      window.ethereum,
      HARDHAT_NETWORK  // ← ENS fix: explicit network
    );
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  };

  // ── Issue credential ──────────────────────────────────────────────────────
  const issueCredential = useCallback(async ({ recipientWallet, skillName, sessionId }) => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx       = await contract.issueCredential(recipientWallet, skillName, sessionId);
      await tx.wait();
      return {
        txHash:      tx.hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      };
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Record session ────────────────────────────────────────────────────────
  const recordSession = useCallback(async ({ peer2Wallet, skill1, skill2, duration, dbSessionId }) => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx       = await contract.recordSession(
        peer2Wallet, skill1, skill2,
        duration,
        dbSessionId
      );
      await tx.wait();
      return {
        txHash:      tx.hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      };
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Get credentials ───────────────────────────────────────────────────────
  const getCredentials = useCallback(async (walletAddress) => {
    if (!CONTRACT_ADDRESS || !walletAddress) return [];
    try {
      const contract = await getContract(false);
      const creds    = await contract.getCredentials(walletAddress);
      return creds.map(c => ({
        id:        Number(c.id),
        recipient: c.recipient,
        issuedBy:  c.issuedBy,
        skillName: c.skillName,
        sessionId: c.sessionId,
        issuedAt:  new Date(Number(c.issuedAt) * 1000).toLocaleDateString("en-IN"),
        valid:     c.valid,
      }));
    } catch (e) {
      console.error("getCredentials error:", e.message);
      return [];
    }
  }, []);

  // ── Get sessions ──────────────────────────────────────────────────────────
  const getOnChainSessions = useCallback(async (walletAddress) => {
    if (!CONTRACT_ADDRESS || !walletAddress) return [];
    try {
      const contract = await getContract(false);
      const sessions = await contract.getSessions(walletAddress);
      return sessions.map(s => ({
        id:          Number(s.id),
        user1:       s.user1,
        user2:       s.user2,
        skill1:      s.skill1,
        skill2:      s.skill2,
        duration:    Number(s.duration),
        completedAt: new Date(Number(s.completedAt) * 1000).toLocaleString("en-IN"),
        sessionId:   s.sessionId,
      }));
    } catch (e) {
      console.error("getSessions error:", e.message);
      return [];
    }
  }, []);

  return {
    wallet,
    loading,
    error,
    hasMetaMask,
    connectWallet,
    checkConnection,
    issueCredential,
    recordSession,
    getCredentials,
    getOnChainSessions,
    CONTRACT_ADDRESS,
  };
}
