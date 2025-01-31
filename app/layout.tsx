"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { WagmiConfig, createConfig, configureChains, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import {
  getDefaultWallets,
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  AuthenticationStatus,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Toaster } from "react-hot-toast";
import { SiweMessage } from "siwe";

import { NavBar } from "./components/nav-bar";
import { AddressContext } from "./components/context";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const projectId = "c1de7de6d9dac11ced03c7516792c20c";

const connectors = connectorsForWallets([
  {
    groupName: "My Goodhive App",
    wallets: [
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }), // FIXME: WalletConnect is not working as expected
    ],
  },
]);

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
  webSocketPublicClient,
});

export const fetchCache = "force-no-store";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>("loading");
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current || verifyingRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const checkAuthResponse = await fetch("/api/auth/me");

        const authResponse = await checkAuthResponse.json();

        const authenticated = Boolean(authResponse?.ok === true);

        if (authenticated) {
          setAuthStatus("authenticated");
          setWalletAddress(authResponse?.address);
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        console.error(error);

        setAuthStatus("unauthenticated");
      } finally {
        fetchingStatusRef.current = false;
      }
    };

    fetchStatus();

    window.addEventListener("focus", fetchStatus);

    return () => window.removeEventListener("focus", fetchStatus);
  }, []);

  const authAdapter = useMemo(() => {
    return createAuthenticationAdapter({
      getNonce: async () => {
        const generateCookieNonceResponse = await fetch("/api/auth/nonce");

        return await generateCookieNonceResponse.text();
      },

      createMessage: ({ nonce, address, chainId }) => {
        return new SiweMessage({
          domain: window.location.host,
          address,
          statement: "Sign in with Ethereum to the app.",
          uri: window.location.origin,
          version: "1",
          chainId,
          nonce,
        });
      },

      getMessageBody: ({ message }) => {
        return message.prepareMessage();
      },

      verify: async ({ message, signature }) => {
        verifyingRef.current = true;

        try {
          const singatureVerifyResponse = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, signature }),
          });

          const verifyResponse = await singatureVerifyResponse.json();

          const authenticated = Boolean(verifyResponse?.ok === true);

          if (authenticated) {
            setAuthStatus("authenticated");
            setWalletAddress(verifyResponse?.address);
          } else {
            setAuthStatus("unauthenticated");
          }

          return authenticated;
        } catch (error) {
          console.error(error);

          setAuthStatus("unauthenticated");

          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus("unauthenticated");
      },
    });
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <WagmiConfig config={config}>
          <RainbowKitAuthenticationProvider
            adapter={authAdapter}
            status={authStatus}
          >
            <RainbowKitProvider chains={chains}>
              <div className="flex flex-col min-h-screen">
                <NavBar />
                <Toaster />

                <div className="flex-grow">
                  <AddressContext.Provider value={walletAddress}>
                    {children}
                  </AddressContext.Provider>
                </div>
                <footer className="p-5 text-center text-white bg-yellow-500">
                  <p>
                    &copy; {new Date().getFullYear()} GoodHive. All rights
                    reserved.
                  </p>
                </footer>
              </div>
            </RainbowKitProvider>
          </RainbowKitAuthenticationProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
