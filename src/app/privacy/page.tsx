import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, Database, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - IPTV",
  description:
    "Learn about our privacy practices, local storage data usage, zero-tracking commitments, and IP geolocation handling.",
  alternates: {
    canonical: "https://iptv.usama.dev/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09060e] text-[#f3f0ff] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to IPTV Live</span>
        </Link>

        {/* Header */}
        <div className="space-y-2 border-b border-purple-900/40 pb-6">
          <div className="flex items-center space-x-2 text-purple-400">
            <Lock className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Privacy & Data Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-400">Last updated: August 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section className="space-y-3 p-5 rounded-2xl bg-purple-950/20 border border-purple-800/30">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-400" />
              <span>1. Zero Personal Data Tracking</span>
            </h2>
            <p>
              Your privacy is fundamental. <strong>IPTV</strong> does not require account creation,
              passwords, email registration, or tracking cookies. We do not sell, store, or monetize any
              personal user information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-purple-400" />
              <span>2. Local Storage & Preferences</span>
            </h2>
            <p>
              All user preferences—including your <strong>Favorite channels</strong>,{" "}
              <strong>Watch History</strong>, and <strong>Custom M3U Playlists</strong>—are stored
              exclusively on your device using HTML5 LocalStorage. This data never leaves your browser and
              can be wiped at any time by clearing your browser cache.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. IP Geolocation Lookup</h2>
            <p>
              To offer relevant localized TV broadcasts upon visiting the app, a one-time anonymous IP
              lookup is made through privacy-respecting geolocation services (such as <code>ipwho.is</code>).
              We do not log, retain, or tie IP addresses to individual user identities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Third-Party Media Streams</h2>
            <p>
              When playing a stream, video chunks are fetched directly from the respective broadcaster&apos;s
              content delivery network (CDN). Those third-party hosts operate under their own independent
              privacy policies.
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-purple-900/40 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="whitespace-nowrap">
            <span className="font-orbitron font-black tracking-wider text-gray-300">IPTV</span> • Privacy-Focused TV Streaming
          </span>
          <span className="whitespace-nowrap">
            Powered by{" "}
            <a
              href="https://usama.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Usama Sarwar
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
