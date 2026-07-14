import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Send,
  Sparkles,
  History,
  Plus,
  Bot,
  User,
  Search,
  BarChart2,
  Database,
  Globe,
  FileText,
  ChevronRight,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Clock,
  BrainCircuit,
  ChevronDown,
  Zap,
  ArrowUp,
  Image as ImageIcon,
  File as FileIcon,
  Link as LinkIcon,
  Paperclip,
  Target,
  BarChart3,
  Lightbulb,
  Combine,
  Flag,
  Cloud,
  Folder,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getUsername } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import ReactMarkdown from "react-markdown";
import { ThinkingAnimation, ReasoningStep } from "../ThinkingAnimation";

import { appToast } from '@/lib/feedback';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

const INITIAL_REASONING_STEPS: ReasoningStep[] = [
  {
    id: "understand",
    label: "Understand",
    content: "",
    status: "pending",
    icon: Target,
  },
  {
    id: "analyze",
    label: "Analyze",
    content: "",
    status: "pending",
    icon: BarChart3,
  },
  {
    id: "reason",
    label: "Reason",
    content: "",
    status: "pending",
    icon: Lightbulb,
  },
  {
    id: "synthesize",
    label: "Synthesize",
    content: "",
    status: "pending",
    icon: Combine,
  },
  {
    id: "conclude",
    label: "Conclude",
    content: "",
    status: "pending",
    icon: Flag,
  },
];

const GROQ_MODELS = [
  { id: "openai/gpt-oss-20b", label: "GPT OSS 20B", description: "Fast daily assistant" },
  { id: "openai/gpt-oss-120b", label: "GPT OSS 120B", description: "Deeper reasoning" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", description: "Balanced writing" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", description: "Very fast" },
  { id: "groq/compound-mini", label: "Compound Mini", description: "Agentic quick tasks" },
];

interface WorkspaceAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  context?: any; // Context from the current page
  isAgentMode: boolean;
  setIsAgentMode: (val: boolean) => void;
}

const ChartDisplay = ({
  data,
  type,
  title,
}: {
  data: any[];
  type: string;
  title?: string;
}) => {
  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f59e0b",
    "#10b981",
  ];

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 my-4 shadow-inner">
      {title && (
        <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
      )}
      <div className="h-[250px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={0}
          minWidth={0}
        >
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : type === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4, fill: "#6366f1" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const parseMessage = (content: string) => {
  let reasoning = null;
  let text = content;
  let isThinking = false;
  let proposal = null;
  let chart = null;

  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    const rawText = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    text = rawText.includes("ANSWER:")
      ? rawText.split("ANSWER:")[1].trim()
      : rawText;
    isThinking = false;
  } else {
    const openThinkMatch = content.match(/<think>([\s\S]*)$/);
    if (openThinkMatch) {
      reasoning = openThinkMatch[1].trim();
      const rawText = content.replace(/<think>[\s\S]*$/, "").trim();
      text = rawText.includes("ANSWER:")
        ? rawText.split("ANSWER:")[1].trim()
        : rawText;
      isThinking = true;
    }
  }

  // Extract JSON proposal if present
  const jsonMatch = text.match(
    /```json\s*(\{[\s\S]*?"action":\s*"create_payment_link"[\s\S]*?\})\s*```/,
  );
  if (jsonMatch) {
    try {
      proposal = JSON.parse(jsonMatch[1]);
      text = text.replace(jsonMatch[0], "").trim();
    } catch (e) {
      console.error("Failed to parse proposal JSON", e);
    }
  }

  // Extract Chart JSON if present
  const chartMatch = text.match(
    /```json\s*(\{[\s\S]*?"type":\s*"(bar|line|pie)"[\s\S]*?"data":\s*\[[\s\S]*?\][\s\S]*?\})\s*```/,
  );
  if (chartMatch) {
    try {
      chart = JSON.parse(chartMatch[1]);
      text = text.replace(chartMatch[0], "").trim();
    } catch (e) {
      console.error("Failed to parse chart JSON", e);
    }
  }

  return { reasoning, text, isThinking, proposal, chart };
};

const MessageBubble = ({
  msg,
  handleCopy,
  copiedId,
  handleApproveProposal,
  handleDenyProposal,
  userProfile,
  isGrouped,
}: {
  msg: Message;
  handleCopy: (t: string, id: string) => void;
  copiedId: string | null;
  handleApproveProposal?: (proposal: any) => void;
  handleDenyProposal?: () => void;
  userProfile?: any;
  isGrouped?: boolean;
}) => {
  const { reasoning, text, isThinking, proposal, chart } = parseMessage(
    msg.content,
  );
  const [showReasoning, setShowReasoning] = useState(true);
  const [thinkTime, setThinkTime] = useState(0);
  const [isDoneThinking, setIsDoneThinking] = useState(false);

  useEffect(() => {
    if (isThinking) {
      setShowReasoning(true);
      setIsDoneThinking(false);
    } else if (reasoning && !isThinking) {
      const timer = setTimeout(() => {
        setIsDoneThinking(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isThinking, reasoning]);

  useEffect(() => {
    let interval: any;
    if (isThinking) {
      interval = setInterval(() => {
        setThinkTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isThinking]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} ${isGrouped ? "mt-1" : "mt-6"}`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-all duration-300 ${
          isGrouped
            ? "opacity-0 select-none pointer-events-none"
            : "opacity-100"
        } ${
          msg.role === "user"
            ? "bg-white/5 border-white/10 overflow-hidden"
            : "bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-400/30"
        }`}
      >
        {msg.role === "user" ? (
          userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="You"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </div>

      <div
        className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
      >
        {/* Sender Name & Time - Only show if not grouped */}
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {msg.role === "user" ? userProfile?.full_name || "You" : "Wersee"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-gray-600 font-medium">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(msg.created_at)}
            </div>
          </div>
        )}

        {/* Message Content Container */}
        <div className="space-y-2 w-full">
          {msg.role === "model" && (reasoning || isThinking) && (
            <div className="mb-4">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
              >
                <div className="flex items-center justify-center w-4 h-4 opacity-70">
                  <div className="grid grid-cols-3 gap-[2px]">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 bg-indigo-400 rounded-full"
                        animate={{
                          opacity: isThinking ? [0.2, 1, 0.2] : 0.6,
                          scale: isThinking ? [0.7, 1.3, 0.7] : 1,
                          backgroundColor: isThinking
                            ? ["#818cf8", "#c084fc", "#818cf8"]
                            : "#9ca3af",
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: isThinking ? Infinity : 0,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <span className="flex items-center gap-1.5">
                  {isThinking ? `Thinking • ${thinkTime}s` : "Thought process"}
                  {!isThinking && (
                    <Check className="w-3 h-3 text-emerald-500" />
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${showReasoning ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {showReasoning && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 ml-2"
                  >
                    <div className="pl-5 bg-indigo-500/5 rounded-lg relative py-3">
                      <div className="absolute -left-[13px] top-0 bg-[#050505] p-1 rounded-full">
                        <BrainCircuit
                          className={`w-4 h-4 ${isThinking ? "text-indigo-400 animate-pulse" : "text-gray-600"}`}
                        />
                      </div>
                      <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap ml-1 font-sans">
                        {reasoning}
                        {isThinking && (
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-2 h-4 ml-1 bg-indigo-500 align-middle shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {text && (
            <div
              className={`relative p-4 rounded-2xl shadow-xl backdrop-blur-md border group/bubble ${
                msg.role === "user"
                  ? "bg-white/10 text-white rounded-tr-none border-white/10"
                  : "bg-[#141414]/80 border-white/5 text-gray-200 rounded-tl-none"
              } ${isGrouped ? (msg.role === "user" ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""}`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-black mb-4 mt-6 text-white tracking-tight">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mb-3 mt-5 text-white/90 tracking-tight">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-bold mb-2 mt-4 text-white/80">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-6 leading-relaxed text-gray-300">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-6 space-y-3 text-gray-300">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-6 space-y-3 text-gray-300">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-indigo-300/90">{children}</em>
                    ),
                    code: ({
                      node,
                      inline,
                      className,
                      children,
                      ...props
                    }: any) => {
                      return !inline ? (
                        <div className="bg-black/50 rounded-xl p-4 my-3 overflow-x-auto border border-white/10 shadow-inner">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </div>
                      ) : (
                        <code
                          className="bg-indigo-500/20 rounded-md px-1.5 py-0.5 text-indigo-300 border border-indigo-500/20"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
              {chart && (
                <ChartDisplay
                  data={chart.data}
                  type={chart.type}
                  title={chart.title}
                />
              )}

              {/* Read Receipt for User */}
              {msg.role === "user" && (
                <div className="absolute bottom-1.5 right-2 flex items-center gap-0.5 opacity-0 group-hover/bubble:opacity-40 transition-opacity">
                  <CheckCheck className="w-3 h-3 text-indigo-400" />
                </div>
              )}

              {/* Hover Timestamp for Grouped Messages */}
              {isGrouped && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity text-[9px] text-gray-500 font-medium whitespace-nowrap ${
                    msg.role === "user" ? "right-full mr-3" : "left-full ml-3"
                  }`}
                >
                  {formatTime(msg.created_at)}
                </div>
              )}
            </div>
          )}

          {msg.role === "model" && text && !isThinking && (
            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <button
                onClick={() => handleCopy(text, msg.id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                {copiedId === msg.id ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedId === msg.id ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {proposal && proposal.action === "create_payment_link" && (
            <div className="mt-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">
                    Create Payment Link
                  </h4>
                  <p className="text-xs text-indigo-300">
                    Wersee wants to create a link for you
                  </p>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-3 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Business Name:</span>
                  <span className="text-white font-medium">
                    {proposal.data.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Product:</span>
                  <span className="text-white font-medium">
                    {proposal.data.product_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-medium">
                    {proposal.data.currency?.toUpperCase()}{" "}
                    {proposal.data.price}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleApproveProposal && handleApproveProposal(proposal)
                  }
                  className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Approve & Create
                </button>
                <button
                  onClick={() => handleDenyProposal && handleDenyProposal()}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Deny
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-3 items-start"
  >
    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-lg">
      <Sparkles className="w-5 h-5 text-white animate-pulse" />
    </div>
    <div className="bg-[#141414]/80 border border-white/5 p-4 rounded-2xl rounded-tl-none shadow-xl backdrop-blur-md">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
              backgroundColor: ["#818cf8", "#c084fc", "#818cf8"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
          />
        ))}
      </div>
    </div>
  </motion.div>
);

type AiDropdownOption = {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

const AiDropdown = ({
  id,
  label,
  value,
  options,
  isOpen,
  align = "right",
  placement = "bottom",
  onToggle,
  onSelect,
}: {
  id: string;
  label: string;
  value: string;
  options: AiDropdownOption[];
  isOpen: boolean;
  align?: "left" | "right";
  placement?: "top" | "bottom";
  onToggle: (id: string) => void;
  onSelect: (value: string) => void;
}) => {
  const selected = options.find((option) => option.id === value) || options[0];
  const SelectedIcon = selected?.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="h-10 min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-left hover:bg-white/10 transition-all shadow-inner"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 min-w-0">
          {SelectedIcon && (
            <SelectedIcon className="w-4 h-4 text-indigo-300 shrink-0" />
          )}
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 leading-none">
              {label}
            </span>
            <span className="mt-1 flex items-center gap-2 text-xs font-bold text-gray-100 min-w-0">
              <span className="truncate">{selected?.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </span>
          </span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={`absolute w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#111]/95 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl z-[300] ${
              placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } ${
              align === "left" ? "left-0" : "right-0"
            }`}
          >
            {options.map((option) => {
              const OptionIcon = option.icon;
              const active = option.id === value;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelect(option.id);
                    onToggle("");
                  }}
                  className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                    active
                      ? "bg-indigo-500/15 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {OptionIcon && (
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        active
                          ? "border-indigo-400/30 bg-indigo-500/20 text-indigo-200"
                          : "border-white/10 bg-white/5 text-gray-400"
                      }`}
                    >
                      <OptionIcon className="w-4 h-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {active && <Check className="mt-1 w-4 h-4 text-indigo-300" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WorkspaceAiSidebar: React.FC<WorkspaceAiSidebarProps> = ({
  isOpen,
  onClose,
  context,
  isAgentMode,
  setIsAgentMode,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(
    INITIAL_REASONING_STEPS,
  );
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<
    { type: "image" | "file" | "context"; name: string; data?: string }[]
  >([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState(126000);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<any[]>([]);
  const [cloudPath, setCloudPath] = useState<string[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [selectedModel, setSelectedModel] = useState(GROQ_MODELS[0].id);
  const [openHeaderMenu, setOpenHeaderMenu] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedModelMeta =
    GROQ_MODELS.find((model) => model.id === selectedModel) || GROQ_MODELS[0];

  const modelOptions: AiDropdownOption[] = GROQ_MODELS.map((model) => ({
    id: model.id,
    label: model.label,
    description: model.description,
    icon: BrainCircuit,
  }));

  const modeOptions: AiDropdownOption[] = [
    {
      id: "assistant",
      label: "Assistant",
      description: "Answers, drafts, analysis and workspace guidance.",
      icon: Bot,
    },
    {
      id: "agent",
      label: "Agent",
      description: "Autonomous workspace help with approval for sensitive actions.",
      icon: Zap,
    },
  ];

  const tokenOptions: AiDropdownOption[] = [
    {
      id: "tokens",
      label:
        tokensRemaining >= 1000
          ? `${(tokensRemaining / 1000).toFixed(0)}k tokens`
          : `${tokensRemaining} tokens`,
      description: "Remaining AI usage for this workspace period.",
      icon: Clock,
    },
  ];

  const toggleHeaderMenu = (id: string) => {
    setOpenHeaderMenu((current) => (current === id || !id ? null : id));
  };

  useEffect(() => {
    if (showCloudPicker) {
      fetchCloudFiles();
    }
  }, [showCloudPicker, cloudPath]);

  useEffect(() => {
    if (!isOpen) {
      setOpenHeaderMenu(null);
    }
  }, [isOpen]);

  const fetchCloudFiles = async () => {
    setIsLoadingCloud(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const pathString = [user.id, ...cloudPath].join("/");
      const { data, error } = await supabase.storage
        .from("business_storage")
        .list(pathString, { limit: 100 });

      if (error) throw error;

      const formatted = data
        .map((item) => ({
          id: item.id || item.name,
          name: item.name,
          isFolder: !item.id,
          path: [...cloudPath, item.name].join("/"),
          type: item.metadata?.mimetype,
        }))
        .filter((item) => item.name !== ".emptyFolderPlaceholder");

      formatted.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      setCloudFiles(formatted);
    } catch (err) {
      console.error("Error fetching cloud files:", err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleSelectCloudFile = async (file: any) => {
    if (file.isFolder) {
      setCloudPath([...cloudPath, file.name]);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from("business_storage")
        .download([user.id, file.path].join("/"));

      if (error || !data) throw error;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            type: file.type?.startsWith("image/") ? "image" : "file",
            name: file.name,
            data: base64data,
          },
        ]);
        setShowCloudPicker(false);
      };
      reader.readAsDataURL(data);
    } catch (err) {
      console.error("Error downloading cloud file:", err);
      appToast("Failed to attach file from cloud.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChats();
      fetchTokens();
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setUserProfile(profile);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase.rpc("get_or_reset_tokens");
      if (data) {
        setTokensRemaining(data);
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      setAttachments((prev) => [...prev, { type, name: file.name, data }]);
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
  };

  const addContextPage = () => {
    setAttachments((prev) => [
      ...prev,
      { type: "context", name: "Current Page Context" },
    ]);
    setShowAttachmentMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Save draft
  useEffect(() => {
    if (!currentChatId) return;

    const timeoutId = setTimeout(async () => {
      await supabase
        .from("ai_chats")
        .update({ last_prompt_draft: input })
        .eq("id", currentChatId);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [input, currentChatId]);

  // Load draft
  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
      // Fetch draft
      supabase
        .from("ai_chats")
        .select("last_prompt_draft")
        .eq("id", currentChatId)
        .single()
        .then(({ data }) => {
          if (data?.last_prompt_draft) {
            setInput(data.last_prompt_draft);
          } else {
            setInput("");
          }
        });
    } else {
      setMessages([]);
      setInput("");
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const fetchChats = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("ai_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setChats(data);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const createNewChat = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ai_chats")
      .insert({
        user_id: user.id,
        title: "New Chat",
      })
      .select()
      .single();

    if (data) {
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
      setIsHistoryOpen(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    await supabase.from("ai_chats").delete().eq("id", chatId);
    setChats(chats.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage = input.trim() || "Please review the attached context.";
    setInput("");
    setIsLoading(true);
    setReasoningSteps(
      INITIAL_REASONING_STEPS.map((s) => ({
        ...s,
        status: "pending",
        content: "",
      })),
    );

    let chatId = currentChatId;

    // Create chat if doesn't exist
    if (!chatId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("ai_chats")
          .insert({
            user_id: user.id,
            title: userMessage.slice(0, 30) + "...",
          })
          .select()
          .single();

        if (data) {
          chatId = data.id;
          setCurrentChatId(chatId);
          setChats([data, ...chats]);
        }
      }
    }

    if (!chatId) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          role: "model",
          content: "Sorry, I encountered an error: Please sign in again before using Wersee AI.",
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }
    
    const history = messages.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.content,
    }));

    // Prepare message content with attachments
    let finalUserMessage = userMessage;
    if (attachments.length > 0) {
      finalUserMessage +=
        "\n\nAttachments:\n" +
        attachments.map((a) => `- ${a.name} (${a.type})`).join("\n");
    }

    // Optimistic update
    const tempUserMsg: Message = {
      id: "temp-user",
      role: "user",
      content: finalUserMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setAttachments([]); // Clear attachments after sending

    try {
      // Save user message
      await supabase.from("ai_messages").insert({
        chat_id: chatId,
        role: "user",
        content: finalUserMessage,
      });

      // Fetch user's files from storage to provide context
      let storageContext = "";
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: files, error } = await supabase.storage
            .from("business_storage")
            .list(user.id, {
              limit: 100,
              sortBy: { column: "created_at", order: "desc" },
            });

          if (!error && files && files.length > 0) {
            storageContext =
              `\n\nUser's Cloud Storage Files (Root Directory):\n` +
              files
                .filter((f) => f.name !== ".emptyFolderPlaceholder")
                .map((f) => `- ${f.name} (${f.id ? "File" : "Folder"})`)
                .join("\n");
          }
        }
      } catch (e) {
        console.error("Failed to fetch storage context for AI", e);
      }

      // Prepare context for AI
      const systemInstruction = `You are 'Wersee', an elite AI assistant for the 'Wersee' platform.
      ${isAgentMode ? "AGENT MODE IS ACTIVE: You have full autonomous control over the workspace. You can perform any action, click any UI element, and manage the entire business. However, for SENSITIVE ACTIONS (like creating payments, accessing private keys, or modifying security settings), you MUST ask for permission first." : "You are in standard assistant mode. Help users with their requests."}
      
      IMPORTANT PRODUCT LOGIC:
      - In Wersee, a 'Digital Product' is a 'Course' and a 'Course' is a 'Digital Product'. They are interchangeable.
      - When a user asks about courses, treat them as digital products.
      - When a user asks about digital products, include courses in your reasoning.
      
      FORMATTING CAPABILITIES:
      - You support full Markdown.
      - Use headers (# ## ###) for different text sizes.
      - Use bold, italics, and lists for clarity.
      - Ensure you use proper spacing (newlines) between paragraphs for readability.
      
      You have access to the following capabilities:
      - Product descriptions: Generate compelling copy for products.
      - Site Info: Explain features of the Wersee platform.
      - Analytics & Graphing: You can create visual charts (bar, line, pie). To do this, output a JSON block like this:
        \`\`\`json
        {
          "type": "bar", // or "line" or "pie"
          "title": "Sales Performance",
          "data": [
            { "name": "Jan", "value": 400 },
            { "name": "Feb", "value": 300 }
          ]
        }
        \`\`\`
      - Database Search: Help users find their data.
      - Code Generation: Write code, scripts, and technical solutions.
      - Business Operations: Do calculations, financial modeling, and operational planning for the business.
      - Create Payment Links: You can propose creating a payment link for the user. To do this, you MUST output a JSON block like this:
        \`\`\`json
        {
          "action": "create_payment_link",
          "data": {
            "name": "Business Name",
            "product_name": "Product Name",
            "description": "Description",
            "price": 100,
            "currency": "eur",
            "pricing_type": "fixed"
          }
        }
        \`\`\`
        The user will see a UI to approve or deny this proposal.
      
      - IF THE USER HAS NO STRIPE ACCOUNT: If they try to create a link but haven't connected Stripe, guide them to the 'Money Setup' page by explaining they need to go to 'Money' -> 'Setup' in the sidebar.
      
      Current Page Context: ${JSON.stringify(context || {})}
      ${attachments.some((a) => a.type === "context") ? `Additional Context: ${JSON.stringify(context || {})}` : ""}
      ${storageContext}
      
      RESPONSE FORMAT:
      - Start with a short <think>...</think> block that summarizes your visible work plan only.
      - Do not reveal private chain-of-thought. The <think> block must contain concise progress notes the user can safely see.
      Keep responses concise, helpful, and highly professional. Use Markdown for formatting.
      
      STRUCTURED WORK SUMMARY: Before answering, include these concise headings inside the <think> tags:
      1. UNDERSTAND: What is the core question being asked?
      2. ANALYZE: What are the key factors/components involved?
      3. REASON: What approach will you use?
      4. SYNTHESIZE: What should the answer include?
      5. CONCLUDE: What is the most accurate/helpful response?
      
      Important: Use the exact headers "1. UNDERSTAND:", "2. ANALYZE:", etc. for each step.
      After completing all 5 steps, provide the final answer starting with "ANSWER:".`;

      // Add temporary model message for streaming
      const tempModelId = "temp-model-" + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: tempModelId,
          role: "model",
          content: "<think>",
          created_at: new Date().toISOString(),
        },
      ]);

      const { data: aiResponse, error: aiError } = await supabase.functions.invoke("ai-chat", {
        body: {
          model: selectedModel,
          messages: [
            { role: "system", content: systemInstruction },
            ...history,
            { role: "user", content: finalUserMessage },
          ],
          temperature: isAgentMode ? 0.35 : 0.55,
          max_completion_tokens: 1800,
        },
      });

      if (aiError || !aiResponse) {
        let errorMessage = "AI Request failed";
        if (aiError) {
          // Try to extract message from Supabase error
          errorMessage = aiError.message;
          try {
            // Some errors are JSON strings
            const parsed = JSON.parse(aiError.message);
            if (parsed.error) errorMessage = parsed.error;
          } catch (e) {
            // Not JSON, keep original
          }
        }
        throw new Error(errorMessage);
      }

      if (aiResponse.success === false || aiResponse.error) {
        throw new Error(aiResponse.error || "AI Request failed");
      }

      const fullResponse = aiResponse.reply || "I could not generate a response.";

      // Parse reasoning steps for the final response
      const thinkMatch = fullResponse.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
      if (thinkMatch) {
        const reasoningText = thinkMatch[1];
        const steps = [...INITIAL_REASONING_STEPS];
        const stepMarkers = [
          { id: "understand", marker: /1\.\s*UNDERSTAND:/i },
          { id: "analyze", marker: /2\.\s*ANALYZE:/i },
          { id: "reason", marker: /3\.\s*REASON:/i },
          { id: "synthesize", marker: /4\.\s*SYNTHESIZE:/i },
          { id: "conclude", marker: /5\.\s*CONCLUDE:/i },
        ];

        for (let i = 0; i < stepMarkers.length; i++) {
          const current = stepMarkers[i];
          const next = stepMarkers[i + 1];
          const currentMatch = reasoningText.match(current.marker);
          if (currentMatch) {
            const startIndex = currentMatch.index! + currentMatch[0].length;
            let endIndex = -1;
            if (next) {
              const nextMatch = reasoningText.match(next.marker);
              if (nextMatch) endIndex = nextMatch.index!;
            }
            const content = reasoningText
              .substring(startIndex, endIndex !== -1 ? endIndex : reasoningText.length)
              .trim();
            const stepIdx = steps.findIndex((s) => s.id === current.id);
            if (stepIdx !== -1) {
              steps[stepIdx].content = content;
              steps[stepIdx].status = "completed";
            }
          }
        }
        setReasoningSteps(steps);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempModelId ? { ...msg, content: fullResponse } : msg,
        ),
      );

      // Save AI response
      await supabase.from("ai_messages").insert({
        chat_id: chatId,
        role: "model",
        content: fullResponse,
      });

      // Update messages list with real data
      fetchMessages(chatId);

      // Consume tokens
      await supabase.rpc("consume_tokens", { p_amount: 1000 });
      fetchTokens();
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.id.startsWith("temp-model")),
        {
          id: "error-" + Date.now(),
          role: "model",
          content: "Sorry, I encountered an error: " + error.message,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApproveProposal = async (proposal: any) => {
    if (proposal.action === "create_payment_link") {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        const username = getUsername(profile, user);
        const slug =
          proposal.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
          "-" +
          Math.floor(Math.random() * 1000);

        // We need a stripe account to create a link. For now, we'll just insert it.
        // In a real scenario, we'd need to ensure they have a Stripe account connected.
        const { data: profileData } = await supabase
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", user.id)
          .single();

        if (!profileData || !profileData.stripe_account_id) {
          setInput(
            "I don't have a Stripe account connected yet. How do I set one up?",
          );
          setTimeout(() => handleSend(), 100);
          return;
        }

        const { data: newLink, error } = await supabase
          .from("quick_pay_links")
          .insert([
            {
              user_id: user.id,
              username,
              name: proposal.data.name,
              slug,
              product_name: proposal.data.product_name,
              description: proposal.data.description,
              price: proposal.data.price,
              currency: proposal.data.currency || "eur",
              stripe_account_id: profileData.stripe_account_id,
              settings: {
                pricing_type: proposal.data.pricing_type || "fixed",
                colors: {
                  background: "#0A0A0A",
                  card: "#141414",
                  text: "#FFFFFF",
                  secondary_text: "#A1A1AA",
                  border: "#27272A",
                  primary: "#635BFF",
                },
                border_radius: "24px",
              },
              active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Send a message back to the AI
        setInput(
          `I approved the payment link. It was created successfully. The URL is: https://wersee.com/${username}/quick-pay/${slug}`,
        );
        setTimeout(() => handleSend(), 100);
      } catch (err: any) {
        console.error(err);
        setInput(`Failed to create payment link: ${err.message}`);
        setTimeout(() => handleSend(), 100);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDenyProposal = () => {
    setInput("I denied the proposal.");
    setTimeout(() => handleSend(), 100);
  };

  const suggestions = [
    {
      label: "Analyze my sales",
      icon: BarChart2,
      prompt:
        "Can you analyze my recent sales performance and create a bar chart of the last 6 months?",
    },
    {
      label: "Business Plan",
      icon: FileText,
      prompt:
        "Help me create a financial model for a new subscription-based community.",
    },
    {
      label: "Search database",
      icon: Database,
      prompt:
        "Find my top selling products and show me the revenue distribution in a pie chart.",
    },
    {
      label: "Operational Planning",
      icon: Zap,
      prompt:
        "Calculate the break-even point for my business if my fixed costs are €2000/month and margin is 30%.",
    },
  ];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[240]"
          />

          {/* Sidebar / Bottom Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 md:top-0 md:left-auto md:w-full md:max-w-lg bg-[#050505]/90 backdrop-blur-3xl border-t md:border-l md:border-t-0 border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.15)] z-[250] flex flex-col h-[90vh] md:h-full rounded-t-[2rem] md:rounded-none"
          >
            <div className="md:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg tracking-tight">
                    Wersee
                  </h2>
                  <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />{" "}
                    {isAgentMode
                      ? "Agent Mode Active"
                      : `Powered by Groq - ${selectedModelMeta.label}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                  <AiDropdown
                    id="model"
                    label="Model"
                    value={selectedModel}
                    options={modelOptions}
                    isOpen={openHeaderMenu === "model"}
                    onToggle={toggleHeaderMenu}
                    onSelect={setSelectedModel}
                  />
                </div>
                <AiDropdown
                  id="mode"
                  label="Mode"
                  value={isAgentMode ? "agent" : "assistant"}
                  options={modeOptions}
                  isOpen={openHeaderMenu === "mode"}
                  onToggle={toggleHeaderMenu}
                  onSelect={(value) => setIsAgentMode(value === "agent")}
                />
                <button
                  onClick={() => {
                    setOpenHeaderMenu(null);
                    setIsHistoryOpen(!isHistoryOpen);
                  }}
                  className={`p-2.5 rounded-xl transition-all ${isHistoryOpen ? "bg-white/10 text-white shadow-inner" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {isHistoryOpen ? (
                <div className="absolute inset-0 bg-[#0A0A0A] z-10 overflow-y-auto p-4 space-y-2">
                  <button
                    onClick={createNewChat}
                    className="w-full flex items-center gap-3 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors mb-4"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">New Chat</span>
                  </button>

                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Recent Chats
                  </h3>
                  {Array.from(
                    new Map(chats.map((c) => [c.id, c])).values(),
                  ).map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setIsHistoryOpen(false);
                      }}
                      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${currentChatId === chat.id ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-300 truncate">
                          {chat.title || "Untitled Chat"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => deleteChat(e, chat.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Messages Area */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative"
                  >
                    {messages.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center p-6"
                      >
                        <div className="relative mb-8">
                          <div className="absolute inset-0 bg-indigo-500 blur-[40px] opacity-20 rounded-full" />
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center border border-white/10 relative z-10 shadow-2xl">
                            <Sparkles className="w-10 h-10 text-indigo-400" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                          Meet Wersee
                        </h3>
                        <p className="text-gray-400 text-base mb-10 max-w-sm leading-relaxed">
                          Ask for product copy, sales analysis, workspace help,
                          database insights, or operational planning. Groq keeps
                          responses fast while your API key stays server-side.
                        </p>
                        <div className="mb-6 w-full max-w-sm">
                          <AiDropdown
                            id="empty-model"
                            label="Model"
                            value={selectedModel}
                            options={modelOptions}
                            isOpen={openHeaderMenu === "empty-model"}
                            align="left"
                            onToggle={toggleHeaderMenu}
                            onSelect={setSelectedModel}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                          {suggestions.map((suggestion, idx) => (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={idx}
                              onClick={() => setInput(suggestion.prompt)}
                              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-left group shadow-lg"
                            >
                              <div className="p-2.5 bg-black/40 rounded-xl text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/20 transition-colors border border-white/5">
                                <suggestion.icon className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                                {suggestion.label}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      Array.from(
                        new Map(messages.map((m) => [m.id, m])).values(),
                      ).map((msg, idx, arr) => {
                        const prevMsg = arr[idx - 1];
                        const isGrouped =
                          prevMsg &&
                          prevMsg.role === msg.role &&
                          new Date(msg.created_at).getTime() -
                            new Date(prevMsg.created_at).getTime() <
                            60000;

                        return (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            handleCopy={handleCopy}
                            copiedId={copiedId}
                            handleApproveProposal={handleApproveProposal}
                            handleDenyProposal={handleDenyProposal}
                            userProfile={userProfile}
                            isGrouped={isGrouped}
                          />
                        );
                      })
                    )}
                    {isLoading &&
                      !messages.some((m) => m.id.startsWith("temp-model")) && (
                        <div className="flex justify-start w-full mt-6">
                          <ThinkingAnimation
                            steps={reasoningSteps}
                            isDark={true}
                          />
                        </div>
                      )}
                    {isLoading &&
                      messages.some((m) => m.id.startsWith("temp-model")) && (
                        <div className="flex justify-start w-full mt-6">
                          <ThinkingAnimation
                            steps={reasoningSteps}
                            isDark={true}
                          />
                        </div>
                      )}
                    <div ref={messagesEndRef} />

                    {/* Scroll to Bottom Button */}
                    <AnimatePresence>
                      {showScrollButton && (
                        <motion.button
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          onClick={() => scrollToBottom(true)}
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold hover:bg-gray-200 transition-colors z-20"
                        >
                          <ChevronDown className="w-4 h-4" />
                          New Messages
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 sm:p-6 border-t border-white/5 bg-[#050505]">
                    {/* Attachments Preview */}
                    <AnimatePresence>
                      {attachments.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="flex flex-wrap gap-2 mb-3 overflow-hidden"
                        >
                          {attachments.map((att, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 group"
                            >
                              {att.type === "image" ? (
                                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                              ) : att.type === "file" ? (
                                <FileIcon className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span className="text-xs text-gray-300 max-w-[100px] truncate">
                                {att.name}
                              </span>
                              <button
                                onClick={() => removeAttachment(i)}
                                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                              >
                                <X className="w-3 h-3 text-gray-500 hover:text-red-400" />
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative flex flex-col bg-[#141414] border border-white/10 rounded-3xl shadow-2xl p-2">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Ask Wersee anything..."
                        className="w-full bg-transparent py-3 pl-3 pr-4 text-white placeholder:text-gray-500 focus:outline-none resize-none min-h-[44px] max-h-[200px] scrollbar-thin scrollbar-thumb-white/10 overflow-y-auto"
                        rows={1}
                      />
                      <div className="flex items-center justify-between mt-2 px-2 pb-1">
                        <div className="flex items-center gap-3 relative">
                          <button
                            onClick={() =>
                              setShowAttachmentMenu(!showAttachmentMenu)
                            }
                            className={`text-gray-400 hover:text-white transition-colors p-1 rounded-lg ${showAttachmentMenu ? "bg-white/10 text-white" : ""}`}
                          >
                            <Plus className="w-5 h-5" />
                          </button>

                          <AnimatePresence>
                            {showAttachmentMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-4 w-56 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] p-1.5"
                              >
                                <button
                                  onClick={() => imageInputRef.current?.click()}
                                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-300">
                                    Photo
                                  </span>
                                </button>
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <FileIcon className="w-4 h-4" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-300">
                                    Attachment
                                  </span>
                                </button>
                                <button
                                  onClick={addContextPage}
                                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <LinkIcon className="w-4 h-4" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-300">
                                    Context Page
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAttachmentMenu(false);
                                    setShowCloudPicker(true);
                                  }}
                                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <Cloud className="w-4 h-4" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-300">
                                    From Cloud
                                  </span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <input
                            type="file"
                            ref={imageInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "image")}
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, "file")}
                          />

                          <AiDropdown
                            id="tokens"
                            label="Usage"
                            value="tokens"
                            options={tokenOptions}
                            isOpen={openHeaderMenu === "tokens"}
                            align="left"
                            placement="top"
                            onToggle={toggleHeaderMenu}
                            onSelect={() => undefined}
                          />
                        </div>
                        <button
                          onClick={handleSend}
                          disabled={
                            (!input.trim() && attachments.length === 0) ||
                            isLoading ||
                            tokensRemaining <= 0
                          }
                          className="w-8 h-8 bg-white text-black rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Cloud File Picker Modal */}
          <AnimatePresence>
            {showCloudPicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-purple-400" />
                      Select from Cloud
                    </h3>
                    <button
                      onClick={() => setShowCloudPicker(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 shrink-0 overflow-x-auto pb-2">
                    <button
                      onClick={() => setCloudPath([])}
                      className="hover:text-white"
                    >
                      Root
                    </button>
                    {cloudPath.map((folder, idx) => (
                      <React.Fragment key={idx}>
                        <ChevronRight className="w-4 h-4" />
                        <button
                          onClick={() =>
                            setCloudPath(cloudPath.slice(0, idx + 1))
                          }
                          className="hover:text-white"
                        >
                          {folder}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-[300px] border border-white/5 rounded-xl bg-black/20 p-2">
                    {isLoadingCloud ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : cloudFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Cloud className="w-12 h-12 mb-2 opacity-20" />
                        <p>No files found</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Array.from(
                          new Map(cloudFiles.map((f) => [f.id, f])).values(),
                        ).map((file) => (
                          <button
                            key={file.id}
                            onClick={() => handleSelectCloudFile(file)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                          >
                            {file.isFolder ? (
                              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Folder className="w-4 h-4" />
                              </div>
                            ) : file.type?.startsWith("image/") ? (
                              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            ) : file.type?.startsWith("video/") ? (
                              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Video className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-500/10 rounded-lg text-gray-400">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate flex-1">
                              {file.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
