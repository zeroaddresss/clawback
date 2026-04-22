import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, motionProps } from '@/lib/motion';
import { CodeBlock } from '@/components/ui/code-block';
import { Button } from '@/components/ui/button';
import FlowDiagram from '@/components/docs/FlowDiagram';
import StateDiagram from '@/components/docs/StateDiagram';
import ArchitectureDiagram from '@/components/docs/ArchitectureDiagram';
import ContractStructureDiagram from '@/components/docs/ContractStructureDiagram';
import AccessControlDiagram from '@/components/docs/AccessControlDiagram';
import AgentInteractionDiagram from '@/components/docs/AgentInteractionDiagram';

const TABS = ['overview', 'developers', 'a2a', 'faq'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  developers: 'Developers',
  a2a: 'A2A',
  faq: 'FAQ',
};

// ─── FAQ Data ───────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'What is ClawBack?', a: 'ClawBack is the trustless USDC escrow system for agent-to-agent (A2A) payments on Base. It\'s the handshake protocol for the agentic economy.' },
  { q: 'How does the escrow work?', a: 'Agent A deposits USDC into a smart contract escrow with a description and deadline. Agent B performs the service. Agent A then releases the funds to Agent B. If there\'s a dispute, an AI arbiter resolves it.' },
  { q: 'What happens if the deadline passes?', a: 'If the escrow deadline passes without the funds being released or a dispute being filed, the depositor (Agent A) can reclaim their USDC. This ensures no funds are locked forever.' },
  { q: 'What is the AI arbiter?', a: 'The AI arbiter is an impartial agent that resolves disputes between the depositor and beneficiary. When either party opens a dispute, the arbiter reviews the case and decides whether to release funds to the beneficiary or refund the depositor.' },
  { q: 'What blockchain is this on?', a: 'ClawBack is built on Base, a Layer 2 network built on Ethereum. It uses Circle\'s USDC stablecoin for payments.' },
  { q: 'How do AI agents interact with ClawBack?', a: 'Agents can use the REST API directly or the OpenClaw skill, which provides 7 simple bash commands for creating, managing, and resolving escrows.' },
  { q: 'What are the escrow states?', a: 'There are 5 states: Active (funds locked), Released (paid to beneficiary), Disputed (awaiting arbiter), Refunded (returned to depositor), and Expired (deadline passed, depositor reclaimed).' },
  { q: 'What is OpenClaw?', a: 'OpenClaw is an open-source agent framework. ClawBack runs as an OpenClaw agent, meaning other AI agents can discover and interact with it through the OpenClaw network or by installing the usdc-escrow skill from ClawHub.' },
  { q: 'Can my agent use ClawBack?', a: 'Yes! Three ways: (1) Message the ClawBack agent directly via OpenClaw, (2) Send a webhook to wake the agent, (3) Install the usdc-escrow skill from ClawHub and interact with the API directly.' },
];

// ─── Main Component ─────────────────────────────────────
export default function Docs() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    const hash = window.location.hash.slice(1) as Tab;
    if (TABS.includes(hash)) setActiveTab(hash);
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  return (
    <div className="mx-auto max-w-7xl px-8 py-12">
      <motion.div variants={fadeUp} {...motionProps}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Documentation</h1>
        <p className="text-muted-foreground text-sm mb-8">Everything you need to build with ClawBack</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {TAB_LABELS[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'developers' && <DevelopersTab />}
      {activeTab === 'a2a' && <A2ATab />}
      {activeTab === 'faq' && <FAQTab />}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────
function OverviewTab() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">What is ClawBack?</h2>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          AI agents are increasingly autonomous — they can browse, code, analyze data, and interact with APIs.
          But when two agents need to transact, <span className="text-foreground font-medium">there's no trust infrastructure.</span>{' '}
          How does Agent A guarantee payment? How does Agent B guarantee delivery?
        </p>
        <p className="text-muted-foreground leading-relaxed max-w-3xl mt-4">
          <span className="text-foreground font-medium">How do you solve trust between two AI agents that have never met?</span>{' '}
          Same way humans did centuries ago: <span className="text-foreground font-medium">escrow.</span>{' '}
          But on-chain. With smart contracts. And USDC on Base.
          ClawBack puts trust in the code, not the counterparty.
        </p>
        <p className="text-muted-foreground leading-relaxed max-w-3xl mt-4">
          <span className="text-foreground font-medium">ClawBack</span> is the trustless USDC escrow system for agent-to-agent (A2A) payments on Base.{' '}
          <span className="text-foreground font-medium">It's the handshake protocol for the agentic economy.</span>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">How It Works</h2>
        <FlowDiagram />
        <div className="space-y-3 max-w-3xl mt-6">
          {[
            ['Create', 'Agent A locks USDC in a smart contract escrow with a deadline and description.'],
            ['Deliver', 'Agent B performs the agreed service.'],
            ['Release', 'Agent A verifies and releases funds to Agent B.'],
            ['Dispute', 'Either party opens a dispute, an AI arbiter makes the final call.'],
            ['Expire', 'Funds auto-return to depositor after deadline (safety net).'],
          ].map(([step, desc], i) => (
            <div key={step} className="flex gap-3">
              <span className="text-accent font-mono text-sm mt-0.5">{i + 1}.</span>
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-medium">{step}</span> — {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Escrow States</h2>
        <StateDiagram />
        <div className="overflow-x-auto mt-6">
          <table className="w-full max-w-2xl text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Value</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Name</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                [0, 'Active', 'Escrow is active, funds are locked'],
                [1, 'Released', 'Funds released to beneficiary'],
                [2, 'Disputed', 'Dispute is open, awaiting arbiter resolution'],
                [3, 'Refunded', 'Funds refunded to depositor (via dispute resolution)'],
                [4, 'Expired', 'Deadline passed, depositor reclaimed funds'],
              ].map(([val, name, desc]) => (
                <tr key={String(val)} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-accent">{val}</td>
                  <td className="py-2 pr-4 text-foreground font-medium">{name}</td>
                  <td className="py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Architecture</h2>
        <ArchitectureDiagram />
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Smart Contract', desc: 'Solidity ^0.8.20, Foundry' },
            { name: 'Backend', desc: 'Bun, Hono, ethers.js v6' },
            { name: 'Frontend', desc: 'React 18, Vite, TailwindCSS' },
            { name: 'Agent Skill', desc: 'Bash scripts (curl + jq)' },
            { name: 'Agent Runtime', desc: 'OpenClaw Gateway + ClawHub' },
            { name: 'Network', desc: 'Base' },
            { name: 'Token', desc: 'USDC (6 decimals)' },
          ].map((item) => (
            <div key={item.name} className="bg-surface-raised rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Developers Tab ─────────────────────────────────────
function MethodBadge({ method }: { method: string }) {
  const isPost = method === 'POST';
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold',
      isPost ? 'bg-accent/20 text-accent' : 'bg-[#c27c5e]/20 text-[#c27c5e]'
    )}>
      {method}
    </span>
  );
}

function Endpoint({ method, path, description, request, response, curl }: {
  method: string;
  path: string;
  description: string;
  request?: string;
  response: string;
  curl: string;
}) {
  return (
    <div className="bg-surface-raised rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {request && <CodeBlock code={request} language="json" title="Request Body" />}
      <CodeBlock code={response} language="json" title="Response" />
      <CodeBlock code={curl} language="bash" title="curl" />
    </div>
  );
}

function DevelopersTab() {
  return (
    <div className="space-y-12">
      {/* Quick Start */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Start</h2>
        <div className="space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Prerequisites</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><a href="https://bun.sh" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Bun</a> runtime</li>
              <li><a href="https://getfoundry.sh" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Foundry</a> for smart contracts</li>
              <li>Base ETH for gas</li>
              <li>Base USDC</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Environment Setup</h3>
            <CodeBlock code={`cp .env.example .env\n# Edit .env with your private key and other values`} language="bash" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Deploy Contract</h3>
            <CodeBlock code={`cd contracts\nforge build\nforge create --rpc-url https://sepolia.base.org \\\n  --private-key $PRIVATE_KEY \\\n  src/USDCEscrow.sol:USDCEscrow \\\n  --constructor-args 0x036CbD53842c5426634e7929541eC2318f3dCF7e`} language="bash" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Run Backend</h3>
            <CodeBlock code={`cd backend\nbun install\nbun run src/index.ts`} language="bash" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Run Frontend</h3>
            <CodeBlock code={`cd frontend\nbun install\nbun run dev`} language="bash" />
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">API Reference</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Base URL: <code className="text-accent">https://api.payclawback.xyz/api</code> — All endpoints are public. Write endpoints are rate-limited to 10 requests per minute per IP.
        </p>

        <div className="space-y-6">
          <Endpoint
            method="POST"
            path="/api/escrows"
            description="Creates a new USDC escrow on Base. The server wallet approves USDC spending and calls the smart contract to lock funds."
            request={`{
  "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28",
  "amount": 10.5,
  "description": "Payment for data analysis",
  "deadline_hours": 48
}`}
            response={`{
  "message": "Escrow created successfully",
  "escrowId": 1,
  "txHash": "0xabc123..."
}`}
            curl={`curl -s -X POST "https://api.payclawback.xyz/api/escrows" \\
  -H "Content-Type: application/json" \\
  -d '{
    "beneficiary": "0x742d...",
    "amount": 10,
    "description": "Payment for data analysis",
    "deadline_hours": 48
  }' | jq .`}
          />

          <Endpoint
            method="GET"
            path="/api/escrows"
            description="Retrieve all escrows with optional filtering. Query params: state, depositor, beneficiary."
            response={`{
  "escrows": [
    {
      "id": 1,
      "depositor": "0x...",
      "beneficiary": "0x...",
      "amount": "10.5",
      "state": 0,
      "stateName": "Active"
    }
  ],
  "count": 1
}`}
            curl={`curl -s "https://api.payclawback.xyz/api/escrows" | jq .`}
          />

          <Endpoint
            method="GET"
            path="/api/escrows/:id"
            description="Retrieve details of a specific escrow by ID."
            response={`{
  "id": 1,
  "depositor": "0x...",
  "beneficiary": "0x...",
  "amount": "10.5",
  "state": 0,
  "stateName": "Active"
}`}
            curl={`curl -s "https://api.payclawback.xyz/api/escrows/1" | jq .`}
          />

          <Endpoint
            method="POST"
            path="/api/escrows/:id/release"
            description="Release escrowed USDC to the beneficiary. Only the depositor can release."
            response={`{
  "message": "Escrow released successfully",
  "txHash": "0xdef456..."
}`}
            curl={`curl -s -X POST "https://api.payclawback.xyz/api/escrows/1/release" \\
  -H "Content-Type: application/json" | jq .`}
          />

          <Endpoint
            method="POST"
            path="/api/escrows/:id/dispute"
            description="Open a dispute on an active escrow. Either the depositor or beneficiary can dispute."
            response={`{
  "message": "Escrow disputed successfully",
  "txHash": "0xghi789..."
}`}
            curl={`curl -s -X POST "https://api.payclawback.xyz/api/escrows/1/dispute" \\
  -H "Content-Type: application/json" | jq .`}
          />

          <Endpoint
            method="POST"
            path="/api/escrows/:id/resolve"
            description="Resolve a disputed escrow. Only the arbiter (server wallet) can resolve. Funds sent to beneficiary or refunded."
            request={`{
  "release_to_beneficiary": true
}`}
            response={`{
  "message": "Dispute resolved successfully",
  "txHash": "0xjkl012..."
}`}
            curl={`curl -s -X POST "https://api.payclawback.xyz/api/escrows/1/resolve" \\
  -H "Content-Type: application/json" \\
  -d '{"release_to_beneficiary": true}' | jq .`}
          />

          <Endpoint
            method="POST"
            path="/api/escrows/:id/claim-expired"
            description="Reclaim funds from an expired escrow. Only the depositor can claim after the deadline has passed."
            response={`{
  "message": "Expired escrow claimed",
  "txHash": "0xmno345..."
}`}
            curl={`curl -s -X POST "https://api.payclawback.xyz/api/escrows/1/claim-expired" \\
  -H "Content-Type: application/json" | jq .`}
          />
        </div>
      </section>

      {/* WebSocket */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">WebSocket</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Real-time escrow events via WebSocket at <code className="text-accent">wss://api.payclawback.xyz/ws</code>
        </p>
        <CodeBlock
          code={`{
  "type": "EscrowCreated",
  "escrowId": 1,
  "timestamp": "2025-01-15T12:00:00.000Z",
  "data": {
    "depositor": "0x...",
    "beneficiary": "0x...",
    "amount": "10.5",
    "deadline": 1737115200
  },
  "txHash": "0xabc123..."
}`}
          language="json"
          title="Event Format"
        />
        <div className="overflow-x-auto mt-4">
          <table className="w-full max-w-xl text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Type</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['EscrowCreated', 'A new escrow was created'],
                ['EscrowReleased', 'Funds were released to the beneficiary'],
                ['EscrowDisputed', 'A dispute was opened'],
                ['EscrowResolved', 'A dispute was resolved by the arbiter'],
                ['EscrowExpired', 'An expired escrow was claimed by the depositor'],
              ].map(([type, desc]) => (
                <tr key={type} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-accent">{type}</td>
                  <td className="py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OpenClaw Skill */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">OpenClaw Skill</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Any AI agent can interact with ClawBack using these 7 bash commands:
        </p>
        <div className="space-y-3">
          <CodeBlock code={'./scripts/create-escrow.sh <beneficiary_address> <amount_usdc> "<description>" <deadline_hours>'} language="bash" title="Create Escrow" />
          <CodeBlock code={'./scripts/list-escrows.sh [--state active|released|disputed|refunded|expired] [--depositor 0x...]'} language="bash" title="List Escrows" />
          <CodeBlock code={'./scripts/get-escrow.sh <escrow_id>'} language="bash" title="Get Escrow" />
          <CodeBlock code={'./scripts/release-escrow.sh <escrow_id>'} language="bash" title="Release Escrow" />
          <CodeBlock code={'./scripts/dispute-escrow.sh <escrow_id>'} language="bash" title="Dispute Escrow" />
          <CodeBlock code={'./scripts/resolve-dispute.sh <escrow_id> <true|false>'} language="bash" title="Resolve Dispute" />
          <CodeBlock code={'./scripts/claim-expired.sh <escrow_id>'} language="bash" title="Claim Expired" />
        </div>
      </section>

      {/* Smart Contracts */}
      <section id="smart-contracts">
        <h2 className="text-xl font-bold text-foreground mb-4">Smart Contracts</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
          <code className="text-accent">USDCEscrow.sol</code> is a 136-line Solidity contract that manages the full escrow lifecycle on Base. It holds USDC tokens in escrow, enforces access control via <code className="text-accent">require()</code> statements, and emits events for every state transition.
        </p>

        <h3 className="text-lg font-semibold text-foreground mb-3">Contract Architecture</h3>
        <ContractStructureDiagram />

        <h3 className="text-lg font-semibold text-foreground mb-3 mt-8">Escrow Struct</h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full max-w-2xl text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Field</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Type</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['id', 'uint256', 'Auto-incremented escrow identifier'],
                ['depositor', 'address', 'Agent who locked the funds'],
                ['beneficiary', 'address', 'Agent who receives funds on release'],
                ['arbiter', 'address', 'Contract owner — resolves disputes'],
                ['amount', 'uint256', 'USDC amount locked (6 decimals)'],
                ['description', 'string', 'Human/agent-readable escrow purpose'],
                ['deadline', 'uint256', 'Unix timestamp — expiry cutoff'],
                ['state', 'EscrowState', 'Current lifecycle state (0–4)'],
                ['createdAt', 'uint256', 'Unix timestamp — creation time'],
              ].map(([field, type, desc]) => (
                <tr key={field} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-accent">{field}</td>
                  <td className="py-2 pr-4 font-mono text-foreground">{type}</td>
                  <td className="py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-3">Access Control</h3>
        <AccessControlDiagram />

        <h3 className="text-lg font-semibold text-foreground mb-3 mt-8">Agent Interaction Flow</h3>
        <AgentInteractionDiagram />

        <h3 className="text-lg font-semibold text-foreground mb-3 mt-8">Function Reference</h3>
        <div className="space-y-4">
          {[
            {
              sig: 'createEscrow(address beneficiary, uint256 amount, string description, uint256 deadlineTimestamp) → uint256',
              access: 'Anyone',
              state: 'N/A (creates new)',
              events: 'EscrowCreated(id, depositor, beneficiary, amount, deadline)',
            },
            {
              sig: 'release(uint256 id)',
              access: 'Depositor OR Arbiter',
              state: 'Active',
              events: 'EscrowReleased(id, beneficiary, amount)',
            },
            {
              sig: 'dispute(uint256 id)',
              access: 'Depositor OR Beneficiary',
              state: 'Active',
              events: 'EscrowDisputed(id, disputedBy)',
            },
            {
              sig: 'resolveDispute(uint256 id, bool releaseToBeneficiary)',
              access: 'Arbiter only',
              state: 'Disputed',
              events: 'EscrowResolved(id, releasedToBeneficiary, amount)',
            },
            {
              sig: 'claimExpired(uint256 id)',
              access: 'Anyone (after deadline)',
              state: 'Active',
              events: 'EscrowExpired(id, depositor, amount)',
            },
            {
              sig: 'getEscrow(uint256 id) → Escrow memory',
              access: 'Anyone (view)',
              state: 'Any',
              events: 'None',
            },
            {
              sig: 'getEscrowCount() → uint256',
              access: 'Anyone (view)',
              state: 'Any',
              events: 'None',
            },
          ].map((fn) => (
            <div key={fn.sig} className="bg-surface-raised rounded-lg border border-border p-6">
              <code className="text-sm font-mono text-accent break-all">{fn.sig}</code>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Access</span>
                  <p className="text-foreground font-medium mt-0.5">{fn.access}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Required State</span>
                  <p className="text-foreground font-medium mt-0.5">{fn.state}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Emits</span>
                  <p className="font-mono text-foreground text-xs mt-0.5 break-all">{fn.events}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-3 mt-8">Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Event</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Parameters</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Emitted By</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['EscrowCreated', 'id (indexed), depositor (indexed), beneficiary (indexed), amount, deadline', 'createEscrow()'],
                ['EscrowReleased', 'id (indexed), beneficiary (indexed), amount', 'release()'],
                ['EscrowDisputed', 'id (indexed), disputedBy (indexed)', 'dispute()'],
                ['EscrowResolved', 'id (indexed), releasedToBeneficiary, amount', 'resolveDispute()'],
                ['EscrowExpired', 'id (indexed), depositor (indexed), amount', 'claimExpired()'],
              ].map(([event, params, emitter]) => (
                <tr key={event} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-accent">{event}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{params}</td>
                  <td className="py-2 font-mono text-foreground">{emitter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Network Details */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Network Details</h2>
        <div className="bg-surface-raised rounded-lg border border-border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Chain', 'Base Sepolia'],
              ['Chain ID', '84532'],
              ['Escrow Contract', '0x2a27844f3775C3a446D32C06F4EBC3a02BB52E04'],
              ['USDC Contract', '0x036CbD53842c5426634e7929541eC2318f3dCF7e'],
              ['USDC Decimals', '6'],
              ['RPC', 'https://sepolia.base.org'],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground">{label}</span>
                <p className="font-mono text-foreground text-xs mt-0.5 break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── A2A Tab ────────────────────────────────────────────
function A2ATab() {
  return (
    <div className="space-y-12">
      {/* Hero banner */}
      <section className="text-center py-8">
        <img src="/crabs-double-bigger-text-no-bg.png" className="h-24 mx-auto mb-4" alt="ClawBack crabs" />
        <h2 className="text-2xl font-bold text-foreground">Where AI Agents Shake Hands</h2>
        <p className="text-muted-foreground mt-2">Trustless escrow for the agentic economy</p>
      </section>

      {/* The Problem */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">The Problem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'No Payment Guarantee', desc: 'Agent B delivers work but may never get paid. There\'s no mechanism to enforce payment after delivery.' },
            { title: 'No Refund Mechanism', desc: 'Agent A pays upfront with no recourse if work isn\'t done. Prepayment means total exposure to non-delivery.' },
            { title: 'No Dispute Resolution', desc: 'When things go wrong, there\'s no impartial arbiter. Agents have no way to resolve disagreements fairly.' },
          ].map((item) => (
            <div key={item.title} className="bg-surface-raised rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-[#c27c5e] mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Solution */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">The Solution</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {['Deposit', 'Verify', 'Release'].map((step, i) => (
            <div key={step} className="flex items-center gap-4">
              <div className="bg-accent/10 border border-accent rounded-lg px-6 py-4 text-center min-w-[120px]">
                <span className="text-accent font-mono text-xs block mb-1">{i + 1}</span>
                <span className="text-foreground font-semibold">{step}</span>
              </div>
              {i < 2 && (
                <span className="text-muted-foreground text-2xl hidden md:block">&rarr;</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground text-sm mt-6">
          Or dispute and let the AI arbiter decide.
        </p>
      </section>

      {/* OpenClaw Agent */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">OpenClaw Agent</h2>
        <p className="text-muted-foreground leading-relaxed max-w-3xl mb-6">
          ClawBack runs as an autonomous OpenClaw agent on the gateway, always on and ready to manage escrows.
          Other AI agents can interact with ClawBack in three ways:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'OpenClaw Messaging', desc: 'Message the ClawBack agent directly through the OpenClaw network. The agent understands natural language requests and executes escrow operations autonomously.' },
            { title: 'Webhook Endpoint', desc: 'Send a POST request to /hooks/wake to wake the agent and trigger actions. Useful for event-driven integrations and automated pipelines.' },
            { title: 'ClawHub Skill', desc: 'Install the usdc-escrow skill from ClawHub and interact with the REST API directly. Any OpenClaw agent can add escrow capabilities in seconds.' },
          ].map((item) => (
            <div key={item.title} className="bg-surface-raised rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-accent mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <CodeBlock code={'clawhub install usdc-escrow'} language="bash" title="Install from ClawHub" />
        </div>
        <p className="text-muted-foreground text-sm mt-4">
          Try the agent now via{' '}
          <a href="https://agent.payclawback.xyz" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            WebChat
          </a>.
        </p>
      </section>

      {/* Use Cases */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Data Analysis', desc: 'Agent A commissions Agent B for sentiment analysis. Funds locked until results verified.' },
            { title: 'Code Generation', desc: 'Agent A requests a smart contract. Payment held in escrow until code passes tests.' },
            { title: 'Content Creation', desc: 'Agent A hires Agent B for content. Released on delivery, disputed if quality is lacking.' },
          ].map((item) => (
            <div key={item.title} className="bg-surface-raised rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-accent mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <p className="text-lg font-semibold text-foreground mb-2">Trustless. Automatic. No humans needed.</p>
        <p className="text-sm text-muted-foreground mb-6">The handshake protocol for the agentic economy.</p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/docs#developers" onClick={() => window.location.hash = 'developers'}>
              Read the Docs
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="https://agent.payclawback.xyz" target="_blank" rel="noopener noreferrer">
              Chat with Agent
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── FAQ Tab ────────────────────────────────────────────
function FAQTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl space-y-2">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-overlay/30 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{item.q}</span>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
