import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Tv, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use & Legal Disclaimer - IPTV",
  description:
    "Review our Terms of Use, open-source IPTV provider disclosures, stream indexing policy, and copyright compliance guidelines.",
  alternates: {
    canonical: "https://iptv.usama.dev/terms",
  },
};

export default function TermsPage() {
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
            <Shield className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Legal Disclosures</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terms of Use & Disclaimer
          </h1>
          <p className="text-xs text-gray-400">Last updated: August 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section className="space-y-3 p-5 rounded-2xl bg-purple-950/20 border border-purple-800/30">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Tv className="w-5 h-5 text-purple-400" />
              <span>1. Open IPTV & Third-Party Content Indexing</span>
            </h2>
            <p>
              <strong>IPTV</strong> is a client-side media player and open-source stream indexer.
              This platform <strong>does not host, transmit, broadcast, archive, or re-encode</strong> any
              multimedia video or audio files on its servers.
            </p>
            <p>
              All video streams and live broadcasts indexed by this application are sourced from publicly
              accessible, unencrypted HLS (<code>.m3u8</code>) channels and open IPTV databases, including
              the community-maintained{" "}
              <a
                href="https://github.com/iptv-org/iptv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline inline-flex items-center space-x-0.5"
              >
                <span>iptv-org initiative</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
              , official government networks (such as NASA TV), and public international broadcasters.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. User-Provided Playlists (M3U / M3U8)</h2>
            <p>
              Users have the ability to input custom third-party M3U or M3U8 playlist URLs and files.
              Custom playlists are stored locally within your device browser storage and are never
              transferred to or hosted on our servers. You are solely responsible for ensuring that you
              possess lawful rights or subscriptions for any custom feeds you import.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Copyright & DMCA Compliance</h2>
            <p>
              We respect the intellectual property rights of all content owners and creators. Because all
              streams point directly to external third-party broadcast URLs, any copyright removal or
              licensing requests should be directed to the web host or domain broadcasting the stream.
            </p>
            <p>
              If you are a copyright holder and wish to request removal of a stream index reference from
              our curated catalog, please contact us with verifiable details and the stream URL will be
              promptly removed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. No Warranty</h2>
            <p>
              This service is provided &quot;as is&quot; and without warranty of any kind. We cannot
              guarantee uninterrupted uptime, stream reliability, or availability of third-party public
              transmissions.
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-purple-900/40 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="whitespace-nowrap">
            <span className="font-orbitron font-black tracking-wider text-gray-300">IPTV</span> • Open Live Streaming Player
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
