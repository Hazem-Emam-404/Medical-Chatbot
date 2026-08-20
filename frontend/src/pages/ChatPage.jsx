import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import avatarImg from "../assets/avatar.webp";
import { COLORS } from "../constants";
import { ConfidenceBadge } from "../components/chat/ConfidenceBadge";
import { ConversationSidebar } from "../components/chat/ConversationSidebar";
import { EvidencePanel } from "../components/chat/EvidencePanel";
import { FollowUpSuggestions } from "../components/chat/FollowUpSuggestions";
import { RiskBadge } from "../components/chat/RiskBadge";
import { TypewriterText } from "../components/chat/TypewriterText";
import { ConfirmModal } from "../components/ConfirmModal";
import { chatApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const GUEST_CONVS_KEY = "clinicianmind_guest_conversations";
const GUEST_ACTIVE_ID_KEY = "clinicianmind_guest_active_id";

const getCachedGuestConversations = () => {
  try {
    const raw = localStorage.getItem(GUEST_CONVS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCachedGuestConversations = (convs) => {
  try {
    localStorage.setItem(GUEST_CONVS_KEY, JSON.stringify(convs));
  } catch (e) {
    console.error("Failed to save guest conversations cache:", e);
  }
};

export const ChatPage = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isNewChatRequested = searchParams.get("new") === "true";

  // Active chat ID initialization
  const [selectedConversationId, setSelectedConversationId] = useState(() => {
    if (isNewChatRequested) return null;
    const urlId = searchParams.get("id");
    if (urlId) return urlId;
    const token = localStorage.getItem("clinicianmind_token");
    if (token) {
      return localStorage.getItem("clinicianmind_active_chat_id") || null;
    }
    return localStorage.getItem(GUEST_ACTIVE_ID_KEY) || null;
  });

  // Conversations & Bookmarks
  const [conversations, setConversations] = useState(() => {
    const token = localStorage.getItem("clinicianmind_token");
    if (!token) {
      return getCachedGuestConversations();
    }
    return [];
  });
  const [bookmarks, setBookmarks] = useState([]);

  // Messages initialization
  const [messages, setMessages] = useState(() => {
    if (isNewChatRequested) return [];
    const token = localStorage.getItem("clinicianmind_token");
    if (!token) {
      const guestConvs = getCachedGuestConversations();
      const activeId =
        searchParams.get("id") || localStorage.getItem(GUEST_ACTIVE_ID_KEY);
      if (activeId) {
        const found = guestConvs.find((c) => String(c.id) === String(activeId));
        if (found && Array.isArray(found.messages)) return found.messages;
      }
    }
    return [];
  });

  // Active UI States
  const [inputValue, setInputValue] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [activeEvidence, setActiveEvidence] = useState([]);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const isCreatingChatRef = useRef(false);
  const isNavigatingBookmarkRef = useRef(false);
  const recognitionRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  // Track if user manually scrolled up so typewriter doesn't hijack scroll
  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 140;
    userScrolledUpRef.current = !isNearBottom;
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (!isNavigatingBookmarkRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  // Stable callbacks for TypewriterText to prevent re-renders restarting typing
  const handleTypingComplete = useCallback(() => {
    setTypingMessageId(null);
  }, []);

  const handleCharTyped = useCallback(() => {
    if (!userScrolledUpRef.current && !isNavigatingBookmarkRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Auto-scroll to bottom on conversation load, new message, or querying
  useEffect(() => {
    if (!isNavigatingBookmarkRef.current && messages.length > 0 && !userScrolledUpRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom("smooth");
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [messages, isQuerying, scrollToBottom]);

  // Clean ?new=true from URL after starting fresh chat
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setSelectedConversationId(null);
      setMessages([]);
      setTypingMessageId(null);
      setActiveEvidence([]);
      setIsEvidenceOpen(false);
      if (isAuthenticated) {
        localStorage.removeItem("clinicianmind_active_chat_id");
      } else {
        localStorage.removeItem(GUEST_ACTIVE_ID_KEY);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, isAuthenticated, setSearchParams]);

  // Sync selectedConversationId with URL and storage
  useEffect(() => {
    if (isAuthLoading) return;

    if (selectedConversationId) {
      setSearchParams({ id: selectedConversationId }, { replace: true });
      if (isAuthenticated) {
        localStorage.setItem("clinicianmind_active_chat_id", selectedConversationId);
      } else {
        localStorage.setItem(GUEST_ACTIVE_ID_KEY, selectedConversationId);
      }
    } else {
      setSearchParams({}, { replace: true });
      if (isAuthenticated) {
        localStorage.removeItem("clinicianmind_active_chat_id");
      } else {
        localStorage.removeItem(GUEST_ACTIVE_ID_KEY);
      }
    }
  }, [selectedConversationId, isAuthenticated, isAuthLoading, setSearchParams]);

  // Load conversations and bookmarks
  const fetchConversationsAndBookmarks = useCallback(async () => {
    if (isAuthLoading) return;

    if (isAuthenticated) {
      try {
        const [convList, bmList] = await Promise.all([
          chatApi.getConversations().catch(() => []),
          chatApi.getBookmarks().catch(() => []),
        ]);
        setConversations(Array.isArray(convList) ? convList : []);
        setBookmarks(Array.isArray(bmList) ? bmList : []);
      } catch (err) {
        console.error("Failed to load user conversations:", err.message);
      }
    } else {
      // Guest mode: load from cache
      const cached = getCachedGuestConversations();
      setConversations(cached);
      setBookmarks([]);
    }
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    fetchConversationsAndBookmarks();
  }, [fetchConversationsAndBookmarks]);

  // Load message history when selecting a conversation
  useEffect(() => {
    if (isAuthLoading || !selectedConversationId) return;

    if (isCreatingChatRef.current) {
      isCreatingChatRef.current = false;
      return;
    }

    if (isAuthenticated) {
      const loadAuthHistory = async () => {
        try {
          setTypingMessageId(null);
          const fullChat = await chatApi.getConversation(selectedConversationId);
          if (fullChat && Array.isArray(fullChat.messages)) {
            setMessages(fullChat.messages);
          }
        } catch (err) {
          console.error("Failed to load conversation history:", err.message);
          setSelectedConversationId(null);
        }
      };
      loadAuthHistory();
    } else {
      // Guest mode: find in cached guest conversations
      setTypingMessageId(null);
      const guestConvs = getCachedGuestConversations();
      const found = guestConvs.find(
        (c) => String(c.id) === String(selectedConversationId)
      );
      if (found && Array.isArray(found.messages)) {
        setMessages(found.messages);
      } else {
        setSelectedConversationId(null);
        setMessages([]);
      }
    }
  }, [selectedConversationId, isAuthenticated, isAuthLoading]);

  // Start fresh consultation
  const handleNewChat = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setSelectedConversationId(null);
    setMessages([]);
    setTypingMessageId(null);
    setQueryError("");
    setActiveEvidence([]);
    setIsEvidenceOpen(false);
    setSearchParams({}, { replace: true });
    if (isAuthenticated) {
      localStorage.removeItem("clinicianmind_active_chat_id");
    } else {
      localStorage.removeItem(GUEST_ACTIVE_ID_KEY);
    }
  };

  // Open Evidence Panel
  const handleOpenEvidence = (evidenceList) => {
    setActiveEvidence(Array.isArray(evidenceList) ? evidenceList : []);
    setIsEvidenceOpen(true);
  };

  const [pendingDeleteChatId, setPendingDeleteChatId] = useState(null);

  // Trigger Delete Confirmation Modal
  const handleDeleteConversation = (chatId) => {
    setPendingDeleteChatId(chatId);
  };

  // Perform Delete
  const confirmDeleteConversation = async () => {
    const chatId = pendingDeleteChatId;
    setPendingDeleteChatId(null);
    if (!chatId) return;

    if (isAuthenticated) {
      try {
        await chatApi.deleteConversation(chatId);
        setConversations((prev) => prev.filter((c) => String(c.id) !== String(chatId)));
        setBookmarks((prev) => prev.filter((bm) => String(bm.chat_id) !== String(chatId)));

        // Refresh conversations and bookmarked evidence list from server
        fetchConversationsAndBookmarks();

        if (String(selectedConversationId) === String(chatId)) {
          handleNewChat();
          setIsEvidenceOpen(false);
          setActiveEvidence([]);
        }
      } catch (err) {
        console.error("Failed to delete conversation:", err.message);
      }
    } else {
      // Guest mode deletion
      const current = getCachedGuestConversations();
      const updated = current.filter((c) => String(c.id) !== String(chatId));
      saveCachedGuestConversations(updated);
      setConversations(updated);
      if (String(selectedConversationId) === String(chatId)) {
        handleNewChat();
        setIsEvidenceOpen(false);
        setActiveEvidence([]);
      }
    }
  };

  // Toggle Bookmark (Auth only)
  const handleToggleBookmark = async (messageId) => {
    if (!isAuthenticated || !messageId) return;
    try {
      const res = await chatApi.toggleBookmark(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_bookmarked: res.is_bookmarked } : msg
        )
      );
      const updatedBms = await chatApi.getBookmarks().catch(() => []);
      setBookmarks(Array.isArray(updatedBms) ? updatedBms : []);
    } catch (err) {
      console.error("Failed to bookmark message:", err.message);
    }
  };

  // Select Bookmark from Sidebar: Navigate to chat and smoothly scroll directly to the bookmarked message
  const handleSelectBookmark = (bm) => {
    if (bm.chat_id) {
      isNavigatingBookmarkRef.current = true;
      setSelectedConversationId(bm.chat_id);
      setHighlightedMessageId(bm.id);

      const tryScroll = () => {
        const el = document.getElementById(`message-${bm.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            isNavigatingBookmarkRef.current = false;
          }, 1500);
          return true;
        }
        return false;
      };

      // Try immediately, or poll while messages finish loading
      if (!tryScroll()) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (tryScroll() || attempts > 25) {
            clearInterval(interval);
          }
        }, 80);
      }

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }
  };

  // Multimodal Voice Dictation (Speech-to-Text)
  const toggleVoiceDictation = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInputValue(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start voice dictation:", err);
      setIsListening(false);
    }
  };

  // Multimodal Audio Read-Aloud (Text-to-Speech)
  const handleToggleSpeech = (messageId, textToSpeak) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = String(textToSpeak || "")
      .replace(/[*#_`~[\]]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(messageId);
  };

  // Clean up speech and voice dictation on unmount, page leave, blur, or refresh
  useEffect(() => {
    const stopAllMedia = () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setSpeakingMessageId(null);
      setIsListening(false);
    };

    window.addEventListener("beforeunload", stopAllMedia);
    window.addEventListener("pagehide", stopAllMedia);

    return () => {
      stopAllMedia();
      window.removeEventListener("beforeunload", stopAllMedia);
      window.removeEventListener("pagehide", stopAllMedia);
    };
  }, []);

  // Send Clinical Query
  const handleSendMessage = async (rawMessage) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);

    const question = (rawMessage || "").trim();
    if (!question || isQuerying) return;

    setQueryError("");
    setInputValue("");
    setIsQuerying(true);
    userScrolledUpRef.current = false;

    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      sender: "human",
      content_text: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      if (isAuthenticated) {
        if (selectedConversationId) {
          // Follow-up in existing DB chat
          const response = await chatApi.sendMessage(selectedConversationId, {
            message: question,
          });

          const targetAiId = response?.ai_response?.id || `ai-${Date.now()}`;
          setTypingMessageId(targetAiId);

          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMsg.id),
            response.user_message,
            response.ai_response,
          ]);

          fetchConversationsAndBookmarks();
        } else {
          // New DB chat
          isCreatingChatRef.current = true;
          const response = await chatApi.createChat({ message: question });

          if (response?.chat_id) {
            setSelectedConversationId(response.chat_id);
            fetchConversationsAndBookmarks();
          }

          const targetAiId = response?.ai_response?.id || `ai-${Date.now()}`;
          setTypingMessageId(targetAiId);

          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMsg.id),
            response.user_message,
            response.ai_response,
          ]);
        }
      } else {
        // ================= GUEST MODE (CACHED) =================
        const guestHistory = messages.map((m) => ({
          sender: m.sender,
          content:
            m.content_text ||
            (typeof m.ai_response_json === "object"
              ? m.ai_response_json?.recommendation
              : "") ||
            "",
        }));

        const response = await chatApi.createChat({
          message: question,
          history: guestHistory.length > 0 ? guestHistory : null,
        });

        const targetAiId = response?.ai_response?.id || `ai-${Date.now()}`;
        setTypingMessageId(targetAiId);

        const newMessages = [
          ...messages.filter((m) => m.id !== tempUserMsg.id),
          response.user_message,
          response.ai_response,
        ];
        setMessages(newMessages);

        const currentGuestConvs = getCachedGuestConversations();

        if (selectedConversationId) {
          // Update existing guest thread
          const updatedConvs = currentGuestConvs.map((c) => {
            if (String(c.id) === String(selectedConversationId)) {
              return {
                ...c,
                last_message_preview: question,
                messages: newMessages,
                updated_at: new Date().toISOString(),
              };
            }
            return c;
          });
          saveCachedGuestConversations(updatedConvs);
          setConversations(updatedConvs);
        } else {
          // Create new guest thread in cache
          isCreatingChatRef.current = true;
          const newGuestId = `guest_${Date.now()}`;
          const title =
            question.length > 38 ? question.slice(0, 38) + "..." : question;
          const newGuestConv = {
            id: newGuestId,
            title,
            last_message_preview: question,
            messages: newMessages,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const updatedConvs = [newGuestConv, ...currentGuestConvs];
          saveCachedGuestConversations(updatedConvs);
          setConversations(updatedConvs);
          setSelectedConversationId(newGuestId);
          localStorage.setItem(GUEST_ACTIVE_ID_KEY, newGuestId);
        }
      }
    } catch (err) {
      setQueryError(err.message || "Failed to generate decision support answer.");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsQuerying(false);
    }
  };

  const selectedConvObj = Array.isArray(conversations)
    ? conversations.find((c) => String(c.id) === String(selectedConversationId))
    : null;

  if (isAuthLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="flex flex-col items-center gap-3">
          <img
            src={avatarImg}
            alt="ClinicianMind AI"
            className="h-12 w-12 rounded-full border object-cover animate-pulse"
            style={{ borderColor: `${COLORS.outlineVariant}66` }}
          />
          <p className="text-xs font-semibold" style={{ color: COLORS.slateSecondary }}>
            Loading clinical session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Top Header */}
      <header
        className="shrink-0 border-b px-4 py-3 md:px-6 z-20"
        style={{
          borderColor: `${COLORS.outlineVariant}66`,
          backgroundColor: COLORS.surface,
        }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: COLORS.primary }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                health_and_safety
              </span>
              ClinicianMind AI
            </Link>
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <Link
                to="/library"
                className="text-secondary hover:text-primary transition-colors"
              >
                Library
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/profile" title="Profile Settings">
                <img
                  alt="Clinician Avatar"
                  src={avatarImg}
                  className="h-8 w-8 rounded-full border object-cover"
                  style={{ borderColor: `${COLORS.outlineVariant}66` }}
                />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Guest Session
                </span>
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border hover:bg-surface-container-low transition-colors"
                  style={{
                    borderColor: `${COLORS.outlineVariant}88`,
                    color: COLORS.primary,
                  }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex min-h-0 flex-1">
        <ConversationSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => {
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setSpeakingMessageId(null);
            isNavigatingBookmarkRef.current = false;
            setSelectedConversationId(id);
          }}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          bookmarks={bookmarks}
          onSelectBookmark={handleSelectBookmark}
          isGuest={!isAuthenticated}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Thread Header */}
          <div
            className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6"
            style={{
              borderColor: `${COLORS.outlineVariant}66`,
              backgroundColor: COLORS.surface,
            }}
          >
            <div>
              <h1
                className="text-base font-semibold md:text-lg truncate max-w-xl"
                style={{ color: COLORS.slatePrimary }}
              >
                {selectedConvObj?.title ||
                  (messages.length > 0
                    ? "Clinical Consultation"
                    : "New Consultation")}
              </h1>
              <p className="text-xs" style={{ color: COLORS.secondary }}>
                Evidence-grounded Clinical Decision Support powered by WHO &
                NICE guidelines
              </p>
            </div>

            {selectedConversationId && (
              <button
                type="button"
                onClick={handleNewChat}
                className="text-xs font-semibold px-3 py-1 rounded-full border text-primary hover:bg-primary/5 transition-colors"
                style={{ borderColor: `${COLORS.primary}44` }}
              >
                + New Chat
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div 
            onScroll={handleScroll}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6"
          >
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
              {messages.length === 0 && (
                <div className="py-16 text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-full bg-ice-blue mx-auto mb-4 flex items-center justify-center border border-outline-variant/30">
                    <img
                      src={avatarImg}
                      alt="Doctor Robot"
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  </div>
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ color: COLORS.slatePrimary }}
                  >
                    How can I assist your clinical decisions today?
                  </h2>
                  <p
                    className="text-sm mb-6"
                    style={{ color: COLORS.slateSecondary }}
                  >
                    Ask about hypertension diagnosis, blood pressure thresholds,
                    pharmacological initiation, or special patient populations.
                  </p>

                  <div className="flex flex-col gap-2 text-left text-xs">
                    {[
                      "What are the blood pressure thresholds for initiating pharmacological treatment?",
                      "What is the target blood pressure for a patient with known cardiovascular disease?",
                      "What initial Step 1 medication is recommended for adults over 55 of Black African descent?",
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sample)}
                        className="p-3 rounded-xl border text-left transition-all hover:border-primary hover:bg-ice-blue"
                        style={{
                          borderColor: `${COLORS.outlineVariant}66`,
                          backgroundColor: COLORS.surfaceContainerLowest,
                          color: COLORS.onSurface,
                        }}
                      >
                        💡 {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((message, idx) => {
                const isHuman =
                  message.sender === "human" || message.sender === "user";

                if (isHuman) {
                  return (
                    <article
                      key={message.id || idx}
                      id={`message-${message.id || idx}`}
                      className="ml-auto flex max-w-xl gap-3 flex-row-reverse"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                        style={{
                          backgroundColor: COLORS.primary,
                        }}
                      >
                        Dr
                      </div>
                      <div
                        className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed md:text-base font-normal shadow-sm whitespace-pre-wrap"
                        style={{
                          backgroundColor: COLORS.surfaceContainerHighest,
                          color: COLORS.onSurface,
                        }}
                      >
                        {String(message.content_text || "")}
                      </div>
                    </article>
                  );
                }

                // AI Response safe parsing
                let aiData = message.ai_response_json;
                if (typeof aiData === "string") {
                  try {
                    aiData = JSON.parse(aiData);
                  } catch {
                    aiData = { recommendation: aiData };
                  }
                }
                aiData = aiData && typeof aiData === "object" ? aiData : {};

                let recommendation = "";
                if (
                  typeof aiData.recommendation === "string" &&
                  aiData.recommendation
                ) {
                  recommendation = aiData.recommendation;
                } else if (
                  typeof message.content_text === "string" &&
                  message.content_text
                ) {
                  recommendation = message.content_text;
                } else if (aiData.error) {
                  recommendation = `Error: ${aiData.error}`;
                } else {
                  recommendation = "Clinical recommendation complete.";
                }

                const status = String(aiData.status || "answered")
                  .toLowerCase()
                  .trim();
                const confidenceStr = String(aiData.confidence || "High");
                const evidenceList = Array.isArray(aiData.supporting_evidence)
                  ? aiData.supporting_evidence
                  : [];
                const safetyNote =
                  typeof aiData.safety_note === "string"
                    ? aiData.safety_note
                    : "Educational information only; not a diagnosis or medical advice.";
                const missingInfo = Array.isArray(aiData.missing_information)
                  ? aiData.missing_information
                  : [];
                const followUpSuggestions = Array.isArray(aiData.follow_up_suggestions)
                  ? aiData.follow_up_suggestions
                  : [];

                const isCurrentTyping =
                  typingMessageId !== null &&
                  (typingMessageId === message.id ||
                    (String(typingMessageId).startsWith("ai-") &&
                      idx === messages.length - 1));

                const isHighlighted =
                  highlightedMessageId !== null &&
                  message.id &&
                  String(highlightedMessageId) === String(message.id);

                return (
                  <article
                    key={message.id || idx}
                    id={`message-${message.id || idx}`}
                    className={`mr-auto flex max-w-4xl gap-3 transition-all duration-700 rounded-2xl p-2 -m-2 ${isHighlighted ? "bg-primary/5 ring-2 ring-primary/40 shadow-sm" : ""
                      }`}
                  >
                    <img
                      src={avatarImg}
                      alt="ClinicianMind AI"
                      className="mt-1 h-9 w-9 rounded-full border object-cover shrink-0"
                      style={{ borderColor: `${COLORS.outlineVariant}66` }}
                    />

                    <div className="min-w-0 flex-1">
                      {/* Top Status & Input Risk Badges */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <ConfidenceBadge
                          status={status}
                          confidence={confidenceStr}
                        />
                        {aiData.input_risk && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
                              String(aiData.input_risk).toLowerCase() === "critical"
                                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                : String(aiData.input_risk).toLowerCase() === "high"
                                ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                            }`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                              {String(aiData.input_risk).toLowerCase() === "critical"
                                ? "emergency"
                                : String(aiData.input_risk).toLowerCase() === "high"
                                ? "warning"
                                : "info"}
                            </span>
                            <span>{aiData.input_risk} Risk</span>
                          </span>
                        )}
                      </div>

                      {/* Main Response Box */}
                      <div
                        className={`rounded-2xl rounded-tl-sm border p-4 shadow-sm transition-all duration-700 ${isHighlighted ? "border-primary shadow-md ring-2 ring-primary/20" : ""
                          }`}
                        style={{
                          borderColor: isHighlighted
                            ? COLORS.primary
                            : `${COLORS.outlineVariant}77`,
                          backgroundColor: isHighlighted
                            ? "rgba(37, 99, 235, 0.04)"
                            : COLORS.surfaceContainerLowest,
                        }}
                      >
                        {/* Recommendation Text with Typewriter Effect */}
                        <div
                          className="text-sm leading-relaxed md:text-base font-normal"
                          style={{ color: COLORS.onSurface }}
                        >
                          <TypewriterText
                            text={recommendation}
                            isTyping={isCurrentTyping}
                            speed={8}
                            onComplete={handleTypingComplete}
                            onCharTyped={handleCharTyped}
                          />
                        </div>

                        {/* Missing Information Note if any */}
                        {missingInfo.length > 0 && (
                          <div
                            className="mt-3 rounded-lg border p-3 text-xs leading-5"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.08)",
                              borderColor: `${COLORS.confidenceMedium}55`,
                              color: COLORS.slatePrimary,
                            }}
                          >
                            <p className="font-semibold mb-1">
                              Clinical Note / Missing Evidence:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {missingInfo.map((info, i) => (
                                <li key={i}>
                                  {typeof info === "string"
                                    ? info
                                    : JSON.stringify(info)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Safety Note */}
                        <div
                          className="mt-3 rounded-lg border p-2.5 text-xs italic"
                          style={{
                            borderColor: `${COLORS.outlineVariant}44`,
                            backgroundColor: COLORS.surfaceContainerLow,
                            color: COLORS.slateSecondary,
                          }}
                        >
                          ⚠️ {safetyNote}
                        </div>

                        {/* Follow-up Clinical Suggestions */}
                        {!isCurrentTyping && followUpSuggestions.length > 0 && (
                          <FollowUpSuggestions
                            items={followUpSuggestions}
                            onSelect={(prompt) => handleSendMessage(prompt)}
                          />
                        )}

                        {/* Action Footer (View Evidence, Listen, Bookmark) */}
                        <div
                          className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3"
                          style={{ borderColor: `${COLORS.outlineVariant}44` }}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {evidenceList.length > 0 && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold hover:bg-primary/5 transition-colors"
                                style={{
                                  borderColor: `${COLORS.primary}44`,
                                  color: COLORS.primary,
                                }}
                                onClick={() => handleOpenEvidence(evidenceList)}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  menu_book
                                </span>
                                <span>
                                  View Evidence ({evidenceList.length})
                                </span>
                              </button>
                            )}

                            {/* Multimodal Audio Read-Aloud */}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSpeech(
                                  message.id || idx,
                                  recommendation
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:bg-primary/5"
                              style={{
                                borderColor:
                                  speakingMessageId === (message.id || idx)
                                    ? COLORS.primary
                                    : `${COLORS.outlineVariant}66`,
                                color:
                                  speakingMessageId === (message.id || idx)
                                    ? COLORS.primary
                                    : COLORS.secondary,
                                backgroundColor:
                                  speakingMessageId === (message.id || idx)
                                    ? "rgba(37, 99, 235, 0.08)"
                                    : "transparent",
                              }}
                              title={
                                speakingMessageId === (message.id || idx)
                                  ? "Stop reading aloud"
                                  : "Listen to recommendation (Text-to-Speech)"
                              }
                            >
                              <span
                                className={`material-symbols-outlined text-[16px] ${speakingMessageId === (message.id || idx)
                                    ? "animate-pulse text-primary"
                                    : ""
                                  }`}
                              >
                                volume_up
                              </span>
                              <span>
                                {speakingMessageId === (message.id || idx)
                                  ? "Speaking..."
                                  : "Listen"}
                              </span>
                            </button>
                          </div>

                          {isAuthenticated && message.id && evidenceList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleBookmark(message.id)}
                              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium hover:bg-surface-container-high transition-colors"
                              style={{
                                color: message.is_bookmarked
                                  ? COLORS.confidenceMedium
                                  : COLORS.secondary,
                              }}
                              title={
                                message.is_bookmarked
                                  ? "Remove bookmark"
                                  : "Bookmark this evidence"
                              }
                            >
                              <span
                                className="material-symbols-outlined text-[18px]"
                                style={{
                                  fontVariationSettings: message.is_bookmarked
                                    ? "'FILL' 1"
                                    : "'FILL' 0",
                                }}
                              >
                                star
                              </span>
                              <span>
                                {message.is_bookmarked ? "Starred" : "Star"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Loading Indicator */}
              {isQuerying && (
                <article className="mr-auto flex max-w-4xl gap-3">
                  <img
                    src={avatarImg}
                    alt="ClinicianMind AI"
                    className="mt-1 h-9 w-9 rounded-full border object-cover animate-pulse"
                    style={{ borderColor: `${COLORS.outlineVariant}66` }}
                  />
                  <div
                    className="rounded-2xl rounded-tl-sm border p-4 flex items-center gap-3 text-sm"
                    style={{
                      borderColor: `${COLORS.outlineVariant}66`,
                      backgroundColor: COLORS.surfaceContainerLowest,
                      color: COLORS.slateSecondary,
                    }}
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span>
                      Retrieving official guideline chunks and formulating
                      grounded answer...
                    </span>
                  </div>
                </article>
              )}

              {/* Error Banner */}
              {queryError && (
                <div
                  className="p-3 rounded-xl border text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    borderColor: `${COLORS.confidenceLow}55`,
                    color: COLORS.confidenceLow,
                  }}
                >
                  <span className="material-symbols-outlined">error</span>
                  <span>{queryError}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div
            className="shrink-0 border-t px-4 py-3 md:px-6 z-20"
            style={{
              borderColor: `${COLORS.outlineVariant}66`,
              backgroundColor: COLORS.surface,
            }}
          >
            <div
              className="mx-auto w-full max-w-4xl rounded-2xl border p-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20"
              style={{ borderColor: `${COLORS.outlineVariant}88` }}
            >
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }
                }}
                placeholder="Ask an evidence-based clinical question (Press Enter or click Mic to dictate)..."
                disabled={isQuerying}
                className="h-16 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none md:text-base disabled:opacity-50"
                style={{ color: COLORS.onSurface }}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: COLORS.secondary }}>
                  {isListening ? (
                    <span className="flex items-center gap-1.5 text-red-600 font-semibold animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                      Listening to clinical dictation...
                    </span>
                  ) : (
                    "Grounded in WHO (2021) & NICE (2023) Guidelines"
                  )}
                </span>

                <div className="flex items-center gap-2">
                  {/* Voice Dictation (Speech-to-Text) Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    disabled={isQuerying}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${isListening
                        ? "bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-300"
                        : "border hover:bg-primary/5 hover:border-primary text-secondary hover:text-primary"
                      }`}
                    style={{
                      borderColor: isListening
                        ? undefined
                        : `${COLORS.outlineVariant}88`,
                    }}
                    title={
                      isListening
                        ? "Listening... Click to stop"
                        : "Voice Dictation (Speech-to-Text)"
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isListening ? "mic" : "mic_none"}
                    </span>
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isQuerying}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md"
                    style={{
                      backgroundColor: COLORS.primary,
                      color: COLORS.onPrimary,
                    }}
                    title="Send clinical inquiry"
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      send
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <p
              className="mt-1.5 text-center text-[11px]"
              style={{ color: COLORS.slateSecondary }}
            >
              ClinicianMind AI is for clinical educational support only. Not a
              substitute for professional medical judgment.
            </p>
          </div>
        </main>

        {/* Slide-in Evidence Panel */}
        <EvidencePanel
          isOpen={isEvidenceOpen}
          evidence={activeEvidence}
          onClose={() => setIsEvidenceOpen(false)}
        />

        {/* Custom Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(pendingDeleteChatId)}
          title="Delete Consultation"
          message="Are you sure you want to delete this consultation thread? All messages and evidence notes in this thread will be permanently removed."
          confirmLabel="Delete Thread"
          cancelLabel="Keep Consultation"
          onConfirm={confirmDeleteConversation}
          onCancel={() => setPendingDeleteChatId(null)}
          isDestructive={true}
        />
      </div>
    </div>
  );
};
