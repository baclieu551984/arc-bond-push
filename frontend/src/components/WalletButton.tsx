"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useEffect, useState, useRef } from 'react';

const ARC_TESTNET_CHAIN_ID = 5042002;

export const WalletButton = () => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Auto switch to Arc Testnet after connecting
  useEffect(() => {
    if (isConnected && chainId && chainId !== ARC_TESTNET_CHAIN_ID && switchChain) {
      try {
        switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
      } catch (error) {
        console.warn('Failed to auto switch to Arc Testnet:', error);
      }
    }
  }, [isConnected, chainId, switchChain]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Avoid hydration mismatches
  if (!mounted) {
    return (
      <button className="btn-primary text-white font-medium h-9 px-4 min-w-[140px] text-base" disabled>
        Connect Wallet
      </button>
    );
  }

  if (isConnected) {
    const isCorrectNetwork = chainId === ARC_TESTNET_CHAIN_ID;
    
    return (
      <div className="flex items-center gap-2">
        {/* Network Status Button */}
        <button
          onClick={() => !isCorrectNetwork && switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
          disabled={isCorrectNetwork}
          className={`h-9 px-4 rounded-lg font-medium text-sm flex items-center gap-2 ${
            isCorrectNetwork
              ? 'bg-gray-100 text-gray-600 border border-custom cursor-default'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200'
          }`}
        >
          {isCorrectNetwork ? (
            <>
              <img src="/arc.svg" alt="Arc" className="w-4 h-4" />
              Arc Testnet
            </>
          ) : (
            '⚠️ Wrong Network'
          )}
        </button>
        
        {/* Wallet Address Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn-primary text-white font-medium h-9 px-4 min-w-[140px] text-base"
          >
            <div className="font-mono text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-secondary rounded-lg shadow-lg border border-custom z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-900 font-semibold">Wallet Address</span>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded border border-custom">
                <span className="font-mono text-sm flex-1 text-gray-900">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-gray-600 hover:text-gray-900 p-1 text-xs"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
              
              {chainId !== ARC_TESTNET_CHAIN_ID && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
                  ⚠️ Wrong network. Please switch to Arc Testnet.
                  <button
                    onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
                    className="block w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-2 rounded text-xs"
                  >
                    Switch to Arc Testnet
                  </button>
                </div>
              )}
              
              <button
                onClick={() => {
                  disconnect();
                  setIsDropdownOpen(false);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        // Use first connector (injected = MetaMask, OKX, etc.)
        if (connectors[0]) {
          connect({ connector: connectors[0] });
        }
      }}
      disabled={isPending}
      className="btn-primary disabled:opacity-50 text-white font-medium h-9 px-4 min-w-[140px] text-base"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

