


"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

import {
  UserButton,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";

import { UserRole } from "@prisma/client";

const Navbar = ({ userRole }) => {
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-4 left-1/2 z-50 w-full max-w-5xl -translate-x-1/2 px-4">
      <div className="rounded-2xl border border-white/20 bg-white/10 shadow-lg shadow-black/5 backdrop-blur-md transition-all duration-200 hover:bg-white/15 dark:border-white/10 dark:bg-black/10 dark:shadow-black/20 dark:hover:bg-black/15">
        
        <div className="flex items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="LeetCode"
              width={42}
              height={42}
            />

            <span className="text-2xl font-bold tracking-widest text-amber-300">
              LeetCode
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center justify-center gap-x-4">
            <Link
              href="/problems"
              className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
            >
              Problems
            </Link>

            <Link
              href="/about"
              className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
            >
              About
            </Link>

            <Link
              href="/profile"
              className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
            >
              Profile
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">

            <ModeToggle />

            {isSignedIn ? (
              <>
                {userRole === UserRole.ADMIN && (
                  <Link href="/create-problem">
                    <Button variant="outline">
                      Create Problem
                    </Button>
                  </Link>
                )}

                <UserButton />
              </>
            ) : (
              <div className="flex items-center gap-2">

                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium hover:bg-white/20 dark:hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="bg-amber-400 text-sm font-medium text-white hover:bg-amber-500"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>

              </div>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;